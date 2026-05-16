# Let's discuss

## Elevator Pitch
This application is an attempt at breaking the barrier to entry for utilizing AI Agent discussion and spec development. To start, it'll be a "board room" simulator where the user can drag and drop "personas" into a board room, select their "discussion" phases, take a loose pitch, and that's it. What they get out of the conversation is relative to what they asked, but to start, it'll be specs. I see in the future it could be chapter outlines or questionairres for Authors, presentation outlines, etc.


## Loose process

The user selects from a "discussion" template to start.
The roundtable will then be populated with Personas.
The user will then enter an idea into a text window.

First, the "lead" agents will do a quick circle, passing the idea to each "lead" persona to ask a very brief first round of clarifying questions about the pitch. "I don't know" should be a perfectly good answer. (1-4 high-level questions).

The AI Agents will then take that idea and extrapolate, compare, refine amongst themselves, and then provide the user with a very brief executive summary of the conversation. The user can either accept the proposal or deny it with corrections.

Then the AI Agents will talk amongst themselves (passing the idea to the specialists) comparing the idea to similar examples of the idea and what people did or didn't like about it, refining the idea, etc. until finally the user is presented with the next round of clarifying questions (Only if the Agents begin to argue too much).

Finally, the user is presented with everything in the UI:
1) The final executive summary
2) The spec / Roadmap / Outline (whatever is relevant)
3) Call-outs (things that were talked about that ended up out of scope that the user should keep in mind)

And the user has the ability to download these files. They could also download the process as a series of SKILL.md files, reference files, the personas.

## Notes
- Hardline: The user should ONLY be prompted with questions that need 1 word/1 sentence answers.
- Hardline: The user should never be presented with more than 5 questions to start or at a checkpoint. The Agents should do most of the thinking and decision making.

## Ideas for the future
- The User could use the UI to create their own personas. Perhaps a questionaire and the user could even upload a document for the UI to use to summarize and create a persona from
- The user could provide a starting spec to either refine it further or make a spec dependent on the implementation of the previous one or just to provide context for the direction of the conversation