#Requires -Version 7.0
<#
.SYNOPSIS
  Set up the two Entra app registrations and the Exchange access policies
  that a personal agent needs to read and send Microsoft 365 mail for one client.

.DESCRIPTION
  One script, no browser session in the Entra portal. Run it from a Mac with pwsh
  as a Global Administrator of the client's tenant. It does, in order:

    1. Signs in to Microsoft Graph (device code if you ask for it).
    2. Finds or creates app 1 "<Client> Assistant" and app 2 "<Client> Assistant Send".
    3. Attaches the .crt files as certificate credentials. Never a client secret.
    4. Sets the Graph APPLICATION permissions. The app role ids are resolved at
       runtime from the Microsoft Graph service principal by their Value.
    5. Creates the service principals and grants admin consent by creating the
       app role assignments on them.
    6. Connects to Exchange Online, creates the mail-enabled security group with
       the named mailboxes, and creates one application access policy per app:
       app 1 is restricted to the group, app 2 to the owner's mailbox alone.
    7. Waits, then runs Test-ApplicationAccessPolicy for every member and for one
       mailbox outside the group (Denied is the right answer there).
    8. Prints both app ids and the exact connect-graph.sh command, and writes a
       JSON summary next to this script (or wherever -OutputPath points).

  Every step is idempotent: run it twice and the second run changes nothing.
  -DryRun signs in, reads what exists, prints every change it would make and
  changes nothing.

  Why two apps: a read app must never be able to send. App 1 holds the read and
  write roles for a small group of mailboxes. App 2 holds Mail.Send only and is
  scoped to the owner alone. The agent's send tool uses app 2 and nothing else.

.PARAMETER Client
  Display name prefix. "Tariq" gives "Tariq Assistant" and "Tariq Assistant Send".

.PARAMETER TenantId
  The client's Entra tenant id (a GUID) or its primary domain.

.PARAMETER OwnerMailbox
  The mailbox the agent sends as. Always a member of the group.

.PARAMETER Mailboxes
  Every mailbox app 1 may read. The owner is added if missing.

.PARAMETER GroupAddress
  SMTP address of the mail-enabled security group. Default:
  <client-slug>-assistant-mailboxes@<domain of OwnerMailbox>.

.PARAMETER Cert1
  Path to the .crt (public half) for app 1. Generated on the agent's machine.

.PARAMETER Cert2
  Path to the .crt for app 2. Required unless -SkipSend.

.PARAMETER Domain
  Overrides the domain taken from OwnerMailbox for the default group address.

.PARAMETER TestMailbox
  A mailbox outside the group used for the Denied check. Found automatically
  if not given.

.PARAMETER OutputPath
  Where the JSON summary goes. Default: setup-entra-<client-slug>.json next to
  this script.

.PARAMETER PropagationWaitSeconds
  How long to wait between creating the policies and testing them. Default 60.

.PARAMETER SkipSend
  Do not create app 2 or its policy. Reads and drafts only.

.PARAMETER DryRun
  Print every change, change nothing.

.PARAMETER UseDeviceCode
  Sign in with a device code shown in the terminal, for a box with no browser.

.EXAMPLE
  pwsh ./setup-entra.ps1 -Client Tariq -TenantId 1aa0bc0e-63f3-4c49-b9be-2869d41eab91 `
    -OwnerMailbox tariq@tfaconstructions.com.au `
    -Mailboxes tariq@tfaconstructions.com.au,kendal@tfaconstructions.com.au `
    -Cert1 ./tariq-assistant.crt -Cert2 ./tariq-assistant-send.crt -UseDeviceCode

.NOTES
  Requires PowerShell 7 on macOS. Missing modules are installed for the current
  user only. Certificates are generated with openssl on the agent's machine into
  ~/.tariq-graph/; only the .crt halves ever leave that machine.

  KNOWN PITFALL (14 Sep 2026, TFA Constructions): after New-ApplicationAccessPolicy
  Graph app-only calls to some group members returned
    403 "[RAOP] : Blocked by tenant configured AppOnly AccessPolicy settings"
  for over an hour, while Test-ApplicationAccessPolicy already said Granted.
  That is propagation, not a broken policy. Wait it out. Do NOT remove the policy
  to "fix" it: an app with Mail.ReadWrite and no policy can read every mailbox
  in the tenant.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)] [string] $Client,
  [Parameter(Mandatory)] [string] $TenantId,
  [Parameter(Mandatory)] [string] $OwnerMailbox,
  [Parameter(Mandatory)] [string[]] $Mailboxes,
  [string] $GroupAddress,
  [string] $Cert1,
  [string] $Cert2,
  [string] $Domain,
  [string] $TestMailbox,
  [string] $OutputPath,
  [int] $PropagationWaitSeconds = 60,
  [switch] $SkipSend,
  [switch] $DryRun,
  [switch] $UseDeviceCode
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Constants. The Graph app id is Microsoft's fixed identifier for the Graph API
# in every tenant. It is not an app role id; those are resolved at runtime.
# ---------------------------------------------------------------------------
$script:GraphResourceAppId = '00000003-0000-0000-c000-000000000000'

$script:App1Roles = @(
  'Mail.ReadWrite',
  'Calendars.ReadWrite',
  'Files.ReadWrite.All',
  'User.Read.All',
  'Contacts.Read',
  'MailboxSettings.Read'
)
$script:App2Roles = @('Mail.Send')

$script:GraphScopes = @(
  'Application.ReadWrite.All',
  'AppRoleAssignment.ReadWrite.All',
  'Directory.Read.All'
)

$script:RequiredModules = @(
  'Microsoft.Graph.Authentication',
  'Microsoft.Graph.Applications',
  'ExchangeOnlineManagement'
)

# Everything the summary needs, filled in as we go.
$script:Summary = [ordered]@{
  client        = $Client
  tenantId      = $TenantId
  dryRun        = [bool] $DryRun
  ranAt         = (Get-Date).ToString('o')
  app1          = $null
  app2          = $null
  group         = $null
  policies      = @()
  tests         = @()
  connectCommand = $null
  propagationNote = 'Graph may return 403 [RAOP] for some mailboxes for an hour or more after the policy is created. Wait. Never remove the policy.'
}

# ---------------------------------------------------------------------------
# Output helpers. One line each, so the transcript reads like a checklist.
# ---------------------------------------------------------------------------
function Write-Step {
  param([string] $Text)
  Write-Host ""
  Write-Host "== $Text" -ForegroundColor Cyan
}

function Write-Ok {
  param([string] $Text)
  Write-Host "  ok    $Text" -ForegroundColor Green
}

function Write-Info {
  param([string] $Text)
  Write-Host "  ..    $Text"
}

function Write-Warn {
  param([string] $Text)
  Write-Host "  WARN  $Text" -ForegroundColor Yellow
}

function Write-Change {
  # A change the script is about to make, or would make under -DryRun.
  param([string] $Text)
  if ($DryRun) {
    Write-Host "  DRY   would $Text" -ForegroundColor Magenta
  } else {
    Write-Host "  DO    $Text" -ForegroundColor White
  }
}

# ---------------------------------------------------------------------------
# Naming. All derived from -Client so two clients never collide.
# ---------------------------------------------------------------------------
function Get-ClientSlug {
  param([string] $Name)
  $slug = $Name.ToLowerInvariant() -replace '[^a-z0-9]+', '-'
  return $slug.Trim('-')
}

function Get-MailDomain {
  param([string] $Address)
  if ($Address -notmatch '@') { throw "Not an email address: $Address" }
  return ($Address -split '@')[1].ToLowerInvariant()
}

function Get-DefaultGroupAddress {
  param([string] $Slug, [string] $MailDomain)
  return "$Slug-assistant-mailboxes@$MailDomain"
}

# ---------------------------------------------------------------------------
# Certificates. Only the public .crt is read. PEM or DER both work.
# ---------------------------------------------------------------------------
function Read-CertificateFile {
  param([string] $Path)
  if (-not $Path) { throw "A certificate path is required." }
  $full = Resolve-Path -Path $Path -ErrorAction SilentlyContinue
  if (-not $full) { throw "Certificate not found: $Path" }
  $text = Get-Content -Path $full -Raw
  if ($text -match '-----BEGIN CERTIFICATE-----') {
    $cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::CreateFromPemFile($full.Path)
  } else {
    $bytes = [System.IO.File]::ReadAllBytes($full.Path)
    $cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($bytes)
  }
  if ($cert.HasPrivateKey) {
    throw "$Path carries a private key. Only the .crt half may leave the agent's machine."
  }
  if ($cert.NotAfter -lt (Get-Date)) {
    throw "$Path expired on $($cert.NotAfter.ToString('yyyy-MM-dd'))."
  }
  return $cert
}

# ---------------------------------------------------------------------------
# Modules. Installed for the current user only, never machine-wide.
# ---------------------------------------------------------------------------
function Install-RequiredModule {
  param([string] $Name)
  if (Get-Module -ListAvailable -Name $Name) {
    Write-Ok "module $Name present"
  } else {
    Write-Change "install module $Name (CurrentUser)"
    Install-Module -Name $Name -Scope CurrentUser -Force -AllowClobber
  }
  Import-Module -Name $Name -ErrorAction Stop
}

# ---------------------------------------------------------------------------
# Sign in. Graph first, Exchange later, each once.
# ---------------------------------------------------------------------------
function Connect-GraphSession {
  param([string] $Tenant, [bool] $DeviceCode)
  $args = @{
    TenantId  = $Tenant
    Scopes    = $script:GraphScopes
    NoWelcome = $true
  }
  if ($DeviceCode) { $args['UseDeviceCode'] = $true }
  Connect-MgGraph @args | Out-Null
  $ctx = Get-MgContext
  if (-not $ctx) { throw "Graph sign-in failed." }
  Write-Ok "Graph signed in as $($ctx.Account) on tenant $($ctx.TenantId)"
  return $ctx
}

function Connect-ExchangeSession {
  param([bool] $DeviceCode)
  $args = @{ ShowBanner = $false }
  if ($DeviceCode) { $args['Device'] = $true }
  Connect-ExchangeOnline @args
  Write-Ok "Exchange Online connected"
}

# ---------------------------------------------------------------------------
# Graph service principal and app role ids. Never hardcoded.
# ---------------------------------------------------------------------------
function Get-GraphServicePrincipal {
  $sp = Get-MgServicePrincipal -Filter "appId eq '$($script:GraphResourceAppId)'" -ErrorAction Stop
  if (-not $sp) { throw "Microsoft Graph service principal not found in this tenant." }
  return $sp
}

function Resolve-AppRoleIds {
  # Returns an ordered hashtable of Value -> role id, in the order asked for.
  param($GraphSp, [string[]] $Values)
  $map = [ordered]@{}
  foreach ($value in $Values) {
    $role = $GraphSp.AppRoles | Where-Object {
      $_.Value -eq $value -and $_.AllowedMemberTypes -contains 'Application'
    } | Select-Object -First 1
    if (-not $role) { throw "Graph has no application role named $value." }
    $map[$value] = $role.Id
  }
  return $map
}

# ---------------------------------------------------------------------------
# App registrations. Found by display name; created single-tenant if missing.
# ---------------------------------------------------------------------------
function Find-Application {
  param([string] $DisplayName)
  $safe = $DisplayName -replace "'", "''"
  $found = @(Get-MgApplication -Filter "displayName eq '$safe'" -All)
  if ($found.Count -gt 1) {
    throw "More than one app registration is named '$DisplayName'. Rename or delete the extras first."
  }
  if ($found.Count -eq 1) { return $found[0] }
  return $null
}

function Initialize-Application {
  param([string] $DisplayName)
  $app = Find-Application -DisplayName $DisplayName
  if ($app) {
    Write-Ok "app '$DisplayName' exists (appId $($app.AppId))"
    return $app
  }
  Write-Change "create app registration '$DisplayName' (single tenant, no redirect URI)"
  if ($DryRun) { return $null }
  $app = New-MgApplication -DisplayName $DisplayName -SignInAudience 'AzureADMyOrg'
  Write-Ok "created appId $($app.AppId)"
  return $app
}

function Set-ApplicationPermissions {
  # Replaces requiredResourceAccess with exactly the Graph roles asked for.
  # That also drops the delegated User.Read the portal adds by default.
  param($App, [string] $DisplayName, $RoleMap)
  $wanted = @($RoleMap.Values | Sort-Object)
  $current = @()
  if ($App -and $App.RequiredResourceAccess) {
    $graphBlock = $App.RequiredResourceAccess | Where-Object { $_.ResourceAppId -eq $script:GraphResourceAppId }
    if ($graphBlock) {
      $current = @($graphBlock.ResourceAccess | Where-Object { $_.Type -eq 'Role' } | ForEach-Object { $_.Id } | Sort-Object)
    }
    $extra = @($App.RequiredResourceAccess | Where-Object { $_.ResourceAppId -ne $script:GraphResourceAppId })
    if ($extra.Count -gt 0) { Write-Warn "'$DisplayName' also lists non-Graph resources; they will be removed" }
  }
  $same = ($current.Count -eq $wanted.Count) -and (@(Compare-Object $current $wanted).Count -eq 0)
  if ($same -and $App) {
    Write-Ok "'$DisplayName' already asks for exactly: $($RoleMap.Keys -join ', ')"
    return
  }
  Write-Change "set '$DisplayName' Graph application permissions to: $($RoleMap.Keys -join ', ')"
  if ($DryRun -or -not $App) { return }
  $access = @()
  foreach ($id in $RoleMap.Values) { $access += @{ Id = $id; Type = 'Role' } }
  $body = @(@{ ResourceAppId = $script:GraphResourceAppId; ResourceAccess = $access })
  Update-MgApplication -ApplicationId $App.Id -RequiredResourceAccess $body
  Write-Ok "permissions set"
}

function Add-ApplicationCertificate {
  # Adds the .crt as a key credential unless the same thumbprint is already there.
  # Graph replaces the whole keyCredentials list on PATCH, so the existing
  # entries are sent back by keyId alongside the new one.
  param($App, [string] $DisplayName, $Cert)
  $existing = @()
  if ($App -and $App.KeyCredentials) { $existing = @($App.KeyCredentials) }
  $hash = $Cert.GetCertHash()
  $match = $existing | Where-Object {
    $_.CustomKeyIdentifier -and ([Convert]::ToBase64String($_.CustomKeyIdentifier) -eq [Convert]::ToBase64String($hash))
  }
  if ($match) {
    Write-Ok "'$DisplayName' already holds certificate $($Cert.Thumbprint)"
    return
  }
  Write-Change "upload certificate $($Cert.Thumbprint) (expires $($Cert.NotAfter.ToString('yyyy-MM-dd'))) to '$DisplayName'"
  if ($DryRun -or -not $App) { return }
  $list = @()
  foreach ($k in $existing) {
    $list += @{
      KeyId               = $k.KeyId
      Type                = $k.Type
      Usage               = $k.Usage
      DisplayName         = $k.DisplayName
      StartDateTime       = $k.StartDateTime
      EndDateTime         = $k.EndDateTime
      CustomKeyIdentifier = $k.CustomKeyIdentifier
    }
  }
  $list += @{
    Type                = 'AsymmetricX509Cert'
    Usage               = 'Verify'
    Key                 = $Cert.RawData
    DisplayName         = "$DisplayName $($Cert.NotAfter.ToString('yyyy-MM'))"
    StartDateTime       = $Cert.NotBefore.ToUniversalTime()
    EndDateTime         = $Cert.NotAfter.ToUniversalTime()
    CustomKeyIdentifier = $hash
  }
  Update-MgApplication -ApplicationId $App.Id -KeyCredentials $list
  Write-Ok "certificate attached"
}

# ---------------------------------------------------------------------------
# Service principals and admin consent.
# Admin consent for application roles IS the app role assignment on the
# service principal. Creating it is what the portal's green tick does.
# ---------------------------------------------------------------------------
function Initialize-ServicePrincipal {
  param($App, [string] $DisplayName)
  if (-not $App) {
    Write-Change "create service principal for '$DisplayName'"
    return $null
  }
  $sp = Get-MgServicePrincipal -Filter "appId eq '$($App.AppId)'" -ErrorAction Stop
  if ($sp) {
    Write-Ok "service principal for '$DisplayName' exists"
    return $sp
  }
  Write-Change "create service principal for '$DisplayName'"
  if ($DryRun) { return $null }
  $sp = New-MgServicePrincipal -AppId $App.AppId
  Write-Ok "service principal created"
  return $sp
}

function Grant-AdminConsent {
  param($Sp, [string] $DisplayName, $GraphSp, $RoleMap)
  $have = @()
  if ($Sp) {
    $have = @(Get-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $Sp.Id -All |
      Where-Object { $_.ResourceId -eq $GraphSp.Id })
  }
  foreach ($value in $RoleMap.Keys) {
    $roleId = $RoleMap[$value]
    if ($have | Where-Object { $_.AppRoleId -eq $roleId }) {
      Write-Ok "'$DisplayName' consented: $value"
      continue
    }
    Write-Change "grant admin consent on '$DisplayName' for $value"
    if ($DryRun -or -not $Sp) { continue }
    New-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $Sp.Id `
      -PrincipalId $Sp.Id -ResourceId $GraphSp.Id -AppRoleId $roleId | Out-Null
    Write-Ok "granted $value"
  }
}

function Invoke-AppSetup {
  # The whole Entra side for one app. Returns a summary block.
  param([string] $DisplayName, $Cert, $GraphSp, [string[]] $RoleValues)
  Write-Step "Entra: $DisplayName"
  $roleMap = Resolve-AppRoleIds -GraphSp $GraphSp -Values $RoleValues
  foreach ($value in $roleMap.Keys) { Write-Info "$value = $($roleMap[$value])" }
  $app = Initialize-Application -DisplayName $DisplayName
  Set-ApplicationPermissions -App $app -DisplayName $DisplayName -RoleMap $roleMap
  Add-ApplicationCertificate -App $app -DisplayName $DisplayName -Cert $Cert
  $sp = Initialize-ServicePrincipal -App $app -DisplayName $DisplayName
  Grant-AdminConsent -Sp $sp -DisplayName $DisplayName -GraphSp $GraphSp -RoleMap $roleMap
  return [ordered]@{
    displayName        = $DisplayName
    appId              = if ($app) { $app.AppId } else { '<not created: dry run>' }
    objectId           = if ($app) { $app.Id } else { $null }
    servicePrincipalId = if ($sp) { $sp.Id } else { $null }
    certThumbprint     = $Cert.Thumbprint
    certExpires        = $Cert.NotAfter.ToString('yyyy-MM-dd')
    roles              = @($roleMap.Keys)
  }
}

# ---------------------------------------------------------------------------
# Exchange Online: the group, the policies, the tests.
# ---------------------------------------------------------------------------
function Initialize-MailboxGroup {
  param([string] $Name, [string] $Address, [string[]] $Members)
  $group = Get-DistributionGroup -Identity $Address -ErrorAction SilentlyContinue
  if (-not $group) {
    Write-Change "create mail-enabled security group '$Name' <$Address> with $($Members.Count) members"
    if ($DryRun) {
      foreach ($m in $Members) { Write-Info "member $m" }
      return $null
    }
    $group = New-DistributionGroup -Name $Name -Type Security -PrimarySmtpAddress $Address -Members $Members
    Write-Ok "group created"
  } else {
    Write-Ok "group '$($group.DisplayName)' <$Address> exists"
  }
  $current = @(Get-DistributionGroupMember -Identity $Address -ResultSize Unlimited |
    ForEach-Object { $_.PrimarySmtpAddress.ToString().ToLowerInvariant() })
  foreach ($m in $Members) {
    if ($current -contains $m.ToLowerInvariant()) {
      Write-Ok "member $m"
      continue
    }
    Write-Change "add member $m"
    if ($DryRun) { continue }
    Add-DistributionGroupMember -Identity $Address -Member $m
    Write-Ok "added $m"
  }
  $strangers = $current | Where-Object { ($Members | ForEach-Object { $_.ToLowerInvariant() }) -notcontains $_ }
  foreach ($s in $strangers) {
    Write-Warn "group also contains $s, which is not in -Mailboxes. Left as is; remove it by hand if it should not be readable."
  }
  return $group
}

function Initialize-AccessPolicy {
  # One RestrictAccess policy per app. Retries because Exchange can take a
  # minute to see a service principal Graph created moments ago.
  param([string] $AppId, [string] $Scope, [string] $Description)
  if (-not $AppId -or $AppId -like '<*') {
    Write-Change "create access policy for $Description scoped to $Scope"
    return $null
  }
  $existing = @(Get-ApplicationAccessPolicy | Where-Object { $_.AppId -eq $AppId })
  if ($existing.Count -gt 0) {
    $scopes = ($existing | ForEach-Object { $_.ScopeName }) -join ', '
    Write-Ok "policy for $AppId exists (scope: $scopes)"
    return $existing[0]
  }
  Write-Change "create access policy: app $AppId, RestrictAccess, scope $Scope"
  if ($DryRun) { return $null }
  $attempt = 0
  while ($true) {
    $attempt++
    try {
      $policy = New-ApplicationAccessPolicy -AppId $AppId -PolicyScopeGroupId $Scope `
        -AccessRight RestrictAccess -Description $Description
      Write-Ok "policy created ($($policy.Identity))"
      return $policy
    } catch {
      if ($attempt -ge 6) { throw }
      Write-Warn "Exchange did not accept the policy yet ($($_.Exception.Message.Trim())). Retry $attempt of 5 in 20s."
      Start-Sleep -Seconds 20
    }
  }
}

function Wait-ForPolicyPropagation {
  # Test-ApplicationAccessPolicy reads the policy directly and turns Granted
  # within minutes. The Graph front end can lag it by an hour or more and
  # answer 403 [RAOP] in the meantime. This wait covers the first, not the
  # second; the operator is told so.
  param([int] $Seconds)
  if ($DryRun) {
    Write-Info "would wait $Seconds seconds for the policies to settle"
    return
  }
  Write-Info "waiting $Seconds seconds for the policies to settle before testing"
  Start-Sleep -Seconds $Seconds
}

function Find-OutsideMailbox {
  # Any user mailbox that is not in the group, for the Denied check.
  param([string[]] $Members)
  $lower = @($Members | ForEach-Object { $_.ToLowerInvariant() })
  $candidates = Get-Mailbox -RecipientTypeDetails UserMailbox -ResultSize 50
  foreach ($c in $candidates) {
    $addr = $c.PrimarySmtpAddress.ToString().ToLowerInvariant()
    if ($lower -notcontains $addr) { return $addr }
  }
  return $null
}

function Test-OnePolicy {
  param([string] $Label, [string] $AppId, [string] $Mailbox, [string] $Expect)
  $row = [ordered]@{ app = $Label; mailbox = $Mailbox; expected = $Expect; result = $null; pass = $null }
  if ($DryRun -or -not $AppId -or $AppId -like '<*') {
    Write-Info "would test $Label on $Mailbox, expecting $Expect"
    $row.result = 'not run'
    return $row
  }
  $r = Test-ApplicationAccessPolicy -AppId $AppId -Identity $Mailbox
  $row.result = [string] $r.AccessCheckResult
  $row.pass = ($row.result -eq $Expect)
  if ($row.pass) {
    Write-Ok "$Label on $Mailbox = $($row.result)"
  } else {
    Write-Warn "$Label on $Mailbox = $($row.result), expected $Expect"
  }
  return $row
}

function Test-AllPolicies {
  param([string] $App1Id, [string] $App2Id, [string] $Owner, [string[]] $Members, [string] $Outsider)
  $rows = @()
  foreach ($m in $Members) {
    $rows += Test-OnePolicy -Label 'app1' -AppId $App1Id -Mailbox $m -Expect 'Granted'
  }
  if ($Outsider) {
    $rows += Test-OnePolicy -Label 'app1' -AppId $App1Id -Mailbox $Outsider -Expect 'Denied'
  } else {
    Write-Warn "no mailbox outside the group was found, so the Denied check for app1 did not run. Pass -TestMailbox."
  }
  if ($App2Id) {
    foreach ($m in $Members) {
      $expect = if ($m -ieq $Owner) { 'Granted' } else { 'Denied' }
      $rows += Test-OnePolicy -Label 'app2' -AppId $App2Id -Mailbox $m -Expect $expect
    }
    if ($Outsider) {
      $rows += Test-OnePolicy -Label 'app2' -AppId $App2Id -Mailbox $Outsider -Expect 'Denied'
    }
  }
  return $rows
}

# ---------------------------------------------------------------------------
# Reporting.
# ---------------------------------------------------------------------------
function Get-ConnectCommand {
  param([string] $App1Id, [string] $App2Id)
  if ($App2Id) { return "zsh ~/tariq-agent/scripts/connect-graph.sh $App1Id $App2Id" }
  return "zsh ~/tariq-agent/scripts/connect-graph.sh $App1Id"
}

function Write-SummaryFile {
  param([string] $Path, $Data)
  $json = $Data | ConvertTo-Json -Depth 8
  Set-Content -Path $Path -Value $json -Encoding utf8
  Write-Ok "summary written to $Path"
}

function Write-FinalReport {
  param($Data, [string] $Path)
  Write-Step "Result"
  Write-Host ""
  Write-Host "  App 1 ($($Data.app1.displayName)):  $($Data.app1.appId)"
  if ($Data.app2) {
    Write-Host "  App 2 ($($Data.app2.displayName)):  $($Data.app2.appId)"
  } else {
    Write-Host "  App 2: skipped (-SkipSend). Reads and drafts only until it exists."
  }
  Write-Host ""
  Write-Host "  On the agent's machine, as the user that owns ~/tariq-agent:"
  Write-Host "    $($Data.connectCommand)" -ForegroundColor Cyan
  Write-Host ""
  $failed = @($Data.tests | Where-Object { $_.pass -eq $false })
  if ($failed.Count -gt 0) {
    Write-Warn "$($failed.Count) policy test(s) did not match. Policies can take up to 30 minutes to answer correctly; run the script again later. Do not remove a policy."
  }
  Write-Host "  Propagation: Graph may keep answering 403 [RAOP] for some mailboxes for an hour" -ForegroundColor Yellow
  Write-Host "  or more after Test-ApplicationAccessPolicy says Granted. Wait it out." -ForegroundColor Yellow
  Write-Host "  Never remove the policy to make the 403 go away: without it the app can read" -ForegroundColor Yellow
  Write-Host "  every mailbox in the tenant." -ForegroundColor Yellow
  Write-Host ""
  Write-Host "  Summary: $Path"
}

# ---------------------------------------------------------------------------
# Main.
# ---------------------------------------------------------------------------
function Invoke-Main {
  $slug = Get-ClientSlug -Name $Client
  $app1Name = "$Client Assistant"
  $app2Name = "$Client Assistant Send"
  $groupName = "$Client Assistant mailboxes"
  $mailDomain = if ($Domain) { $Domain.ToLowerInvariant() } else { Get-MailDomain -Address $OwnerMailbox }
  $groupAddr = if ($GroupAddress) { $GroupAddress.ToLowerInvariant() } else { Get-DefaultGroupAddress -Slug $slug -MailDomain $mailDomain }
  $outPath = if ($OutputPath) { $OutputPath } else { Join-Path $PSScriptRoot "setup-entra-$slug.json" }

  # The owner is always in the group; app 1 must read the mailbox app 2 sends from.
  $members = @($Mailboxes | ForEach-Object { $_.Trim().ToLowerInvariant() } | Where-Object { $_ } | Select-Object -Unique)
  $ownerLower = $OwnerMailbox.Trim().ToLowerInvariant()
  if ($members -notcontains $ownerLower) {
    Write-Warn "owner $OwnerMailbox was not in -Mailboxes; adding it"
    $members += $ownerLower
  }

  Write-Step "Plan"
  Write-Info "client          $Client"
  Write-Info "tenant          $TenantId"
  Write-Info "app 1           $app1Name  ($($script:App1Roles -join ', '))"
  if ($SkipSend) { Write-Info "app 2           skipped" } else { Write-Info "app 2           $app2Name  ($($script:App2Roles -join ', '))" }
  Write-Info "group           $groupName <$groupAddr>"
  foreach ($m in $members) { Write-Info "  member        $m" }
  Write-Info "owner (send)    $ownerLower"
  Write-Info "summary         $outPath"
  if ($DryRun) { Write-Warn "DRY RUN: nothing will be changed" }

  Write-Step "Certificates"
  $cert1 = Read-CertificateFile -Path $Cert1
  Write-Ok "app 1 cert $($cert1.Thumbprint) subject $($cert1.Subject) expires $($cert1.NotAfter.ToString('yyyy-MM-dd'))"
  $cert2 = $null
  if (-not $SkipSend) {
    if (-not $Cert2) { throw "-Cert2 is required unless -SkipSend is given." }
    $cert2 = Read-CertificateFile -Path $Cert2
    Write-Ok "app 2 cert $($cert2.Thumbprint) subject $($cert2.Subject) expires $($cert2.NotAfter.ToString('yyyy-MM-dd'))"
    if ($cert1.Thumbprint -eq $cert2.Thumbprint) {
      throw "Cert1 and Cert2 are the same certificate. Each app needs its own key pair."
    }
  }

  Write-Step "Modules"
  foreach ($m in $script:RequiredModules) { Install-RequiredModule -Name $m }

  Write-Step "Sign in to Microsoft Graph"
  Connect-GraphSession -Tenant $TenantId -DeviceCode ([bool] $UseDeviceCode) | Out-Null
  $graphSp = Get-GraphServicePrincipal
  Write-Ok "Microsoft Graph service principal $($graphSp.Id)"

  $script:Summary.app1 = Invoke-AppSetup -DisplayName $app1Name -Cert $cert1 -GraphSp $graphSp -RoleValues $script:App1Roles
  if (-not $SkipSend) {
    $script:Summary.app2 = Invoke-AppSetup -DisplayName $app2Name -Cert $cert2 -GraphSp $graphSp -RoleValues $script:App2Roles
  }
  Disconnect-MgGraph -ErrorAction SilentlyContinue | Out-Null

  $app1Id = $script:Summary.app1.appId
  $app2Id = if ($script:Summary.app2) { $script:Summary.app2.appId } else { $null }

  Write-Step "Exchange Online: sign in"
  Connect-ExchangeSession -DeviceCode ([bool] $UseDeviceCode)

  Write-Step "Exchange Online: mailbox group"
  $group = Initialize-MailboxGroup -Name $groupName -Address $groupAddr -Members $members
  $script:Summary.group = [ordered]@{
    name    = $groupName
    address = $groupAddr
    members = $members
    exists  = [bool] $group
  }

  Write-Step "Exchange Online: application access policies"
  if (-not $DryRun -and $group -and -not (Get-ApplicationAccessPolicy | Where-Object { $_.AppId -eq $app1Id })) {
    # A group created seconds ago is not always resolvable as a policy scope yet.
    Write-Info "giving the directory 20 seconds to see the group"
    Start-Sleep -Seconds 20
  }
  $p1 = Initialize-AccessPolicy -AppId $app1Id -Scope $groupAddr -Description "$app1Name: $($members.Count) mailboxes"
  $script:Summary.policies += [ordered]@{ app = 'app1'; appId = $app1Id; scope = $groupAddr; identity = if ($p1) { [string] $p1.Identity } else { $null } }
  if ($app2Id) {
    $p2 = Initialize-AccessPolicy -AppId $app2Id -Scope $ownerLower -Description "$app2Name: $ownerLower only"
    $script:Summary.policies += [ordered]@{ app = 'app2'; appId = $app2Id; scope = $ownerLower; identity = if ($p2) { [string] $p2.Identity } else { $null } }
  }

  Write-Step "Exchange Online: prove the policies"
  Wait-ForPolicyPropagation -Seconds $PropagationWaitSeconds
  $outsider = if ($TestMailbox) { $TestMailbox.ToLowerInvariant() } else { Find-OutsideMailbox -Members $members }
  if ($outsider -and ($members -contains $outsider)) {
    throw "-TestMailbox $outsider is inside the group; it must be a mailbox the apps should not reach."
  }
  if ($outsider) { Write-Info "outside mailbox for the Denied check: $outsider" }
  $script:Summary.tests = @(Test-AllPolicies -App1Id $app1Id -App2Id $app2Id -Owner $ownerLower -Members $members -Outsider $outsider)

  Disconnect-ExchangeOnline -Confirm:$false -ErrorAction SilentlyContinue

  $script:Summary.connectCommand = Get-ConnectCommand -App1Id $app1Id -App2Id $app2Id
  Write-SummaryFile -Path $outPath -Data $script:Summary
  Write-FinalReport -Data $script:Summary -Path $outPath
}

Invoke-Main
