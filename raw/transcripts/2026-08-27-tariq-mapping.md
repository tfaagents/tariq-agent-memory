# "Tariq Mapping", 27 Aug 2026 (7 min)

Fireflies recording 01M10MB0CVE8FKG2Y30DATS8HD. Three voices: Speaker 2 = Jaiah,
Speaker 3 = Tariq (the one who bought a Mac Mini and moved to Claude), Speaker 1 = a
third person in the room (identity not confirmed). Timestamps dropped, words as
transcribed.

Speaker 1: That's out.
Jaiah: I reckon we can do all of it.
Speaker 1: This thing, man, that was my idea. Using my guy to make.
Tariq: My idea in compliance.
Speaker 1: No, that's easy. You do the research.
Jaiah: Yeah, yeah, yeah. So what you're thinking is like you need it to visually be able to see the front end like a human. Right. So what form of documents are they using?
Tariq: PDFs or DWG.
Jaiah: And then you need it to do an audit and be able to pick up those. For example, if the hallway has like, all hallways need a 1 meter. And if you need to pick up the dimensions on there.
Tariq: Well, I want to do that on purpose. So, like what I was saying before, because a meter hallway, I don't want to put the dimension because it'll read it. So it won't be looking at the lines, it'll be looking at the number. I wanted to scale up a number of the wall, which is like 100 mil thick. And then scale the drawing, knowing that that would be 900, which is wrong.
Jaiah: But you have some sort of data on there.
Speaker 1: Yeah, something the scale, frame data, not the width.
Jaiah: Okay, yeah, cool.
Tariq: It'll have some dimensions.
Jaiah: It will be able to see the dimensions and use logic to calculate. So it's not like there's nothing there. It has to like go and understand the whole house itself.
Tariq: It has to be algorithmic. If it's agentic, it's gonna forget to check that every time.
Jaiah: Yes, exactly. But the thing about that is if you build a specific agent that does this, it will just train and get better and better at doing this. That's the thing about an agent and that's why OpenClaw. Do you have an OpenClaw agent yourself?
Speaker 1: Can you explain what you started?
Tariq: Started with the whole thing. Got the Mac Mini, spent like three, four, five grand. First two weeks and I just blew it. I lost my. I was like, this is. So then I went just to Claude. And now I've been teaching Claude, like by having projects, just doing individual. OpenClaw, trying.
Jaiah: Yeah. I mean, that's the way to manage. So what we're doing for TFA is like obviously OpenClaw, I'll explain it. Give you a bit of a breakdown. So OpenClaw is like the skeleton, right? It comes with all of its files, its bones, everything installed. And then you plug Claude in as the brain or ChatGPT and then the brain manages these structures of the files. But the bottleneck is like OpenClaw comes with its own file structure that is pretty poor. There's a lot of bloating, unnecessary stuff. Like Windows as an operating system, really slow because there's so much unnecessary stuff on there. So the reason why what we're doing is we're building your dashboard that's live now with agents inside of it. And the reason why we're doing specific agents for that is a specific agent can do specific things. Instead of having one OpenClaw agent that runs one thing at once, you can have.
Tariq: It's kinda like Sintra.
Jaiah: Yeah, kinda. But instead of having OpenClaw in the one spot where you talk to it and you need to do this, pull data from here, create a report, and it's doing multiple things at once, it gets caught in a loop and then messes all of them up. You have one agent for each task and 10 out of 10 times you're going to get the same outcome you want. So, for example, your vehicle registration. So where is that stored?
Speaker 1: I don't know.
Tariq: OneDrive.
Jaiah: OneDrive, yeah. So if we can get access to that OneDrive, we can get an agent that pulls that data and then connects to the Queensland registration system and keeps that up to date, we can have you reporting each week and seeing what you need to do on that. That's one simple agent that we can build.
Tariq: So in other words, you're gonna end up having like 100 agents doing different things.
Jaiah: Yeah, exactly. That's why we're doing a monthly thing.
Tariq: So what happens long term if something happens with the AI, like, I don't know, Claude decides to itself, like, what do you have that you can still retain?
Jaiah: The original data source. So you're not storing all this data in Claude, you're connecting Claude to these databases. And it will update.
Tariq: You can essentially have a local. That's why it would be like a future plan that. Have set up all the stuff using Claude stuff.
Speaker 1: So that's why before you're trying to build like a Claude. Before Claude come out. You're building that through OpenClaw. Now it's like Claude's got it perfected. You just give it agents for each one as you go. So like I'm like a feasibility agent. So like when I was looking at sites, go scrape them. Find me off market sites. Different agents for different things.
Tariq: Yeah, I wanted to act like a real person from my side of things. It's not so much what he like it is, but that's like the entry level. Cuz like if you really think about it, what you should be doing, all of us should be doing, is getting this thing to act like a real human being. Send those emails.
Speaker 1: That's it. But he's got one for emails.
Tariq: Just want to be able to trust it enough. Because with architecture or construction risk is like here. You could kill someone if you said it the wrong way.
Speaker 1: He's around with it with me and then he's talking to Clay. Clay's already made his workflows already. So like each aspect and then that's going to be one agent. So he's got 20 agents. I think he needs. And then he's going to run that. Everyone gets their Mac mini. No more VAs. 20 agents per Mac mini.
Tariq: All right. But everybody get access to all the agents?
Jaiah: No, no, no. You build your own. Like what we're doing is we're building a dashboard. Which you access. You have a log into your dashboard. You can see everyone's agents, whereas they can only see their own.
Tariq: So let's say Clay decides one day, he's like, I'm quitting. I'm gonna mess this agent up.
Jaiah: He can't mess it up like make it learn the wrong rules or something. He can't. The thing about an agent, right, is it's not going to be a chat where you tell it to do different things.
Tariq: So you're going to set the rules.
Jaiah: Yeah. Set the rules. I set the rules in the back.
Speaker 1: How is it ever going to be able to evolve and learn if it's not learning from what you're giving it?
Jaiah: It is. Behind the scenes.
Tariq: I guess the question really is how much involvement does he or you or me have to ensure that this thing is learning without Clay teaching it, giving full access to Clay to do it.
Jaiah: It's constant. So, for example, if we take like this agent, the vehicle registration agent, for example, that will run on a weekly basis, let's say, just to keep you up to date.
Speaker 1: Very simple.
Tariq: Okay, let's just use that. And then let's say Daniel's managing. So Daniel's quitting. He's pissed off with you or something. So he's going to tell you to.
Jaiah: This thing, you can't talk to it.
Tariq: Okay. Let's just say, how does it learn if you're not talking to it? Because that one's different. That one is just doing it along its scheduled task.
Jaiah: Yes. Right. How long do you need me? Yeah, I'll head off. All right, cool.
