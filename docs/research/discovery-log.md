# Discovery Log

A running log of discoveries. Newest first.

---

## D04 — Read two or three PRD examples in the wild. What makes a PRD strong? What makes one weak?

**Name:** Tommy Brown
**Date:** Sept 19
**AI tool used:** No AI needed
**Conversation link(s):** No convo link needed / no AI needed
**Time spent:** 40 mins

### 1. What I did
- [Amazon chatbot PRD](https://assets.nextleap.app/submissions/ProductRequirementsDocumentAmazon-70667445-1e6e-4bac-93f3-0d076706e6fa.pdf) — a chatbot that helps users get product details.
- [MakeStoryTime.com PRD](https://cdn.48web.com/sites/pmprompt/MakeStoryTime.com-PRD.pdf) — an AI storyteller (Story Time 2.0).

I looked through these PRDs and analyzed the differences between them.

### 2. Artifact
As a fresh reader of these PRDs, it seemed like there was a clear winner. Surprisingly, the
Amazon one was very in depth and I could build it if it was handed off to me, but not as much
as the Story Time 2.0 one.

The Story Time 2.0 PRD had its core features more in depth and had an extra section called an
entity relationship diagram (ERD) which consisted of the file paths of each section of the
project. For example, the ERD was divided into users, stories, characters, etc. Giving it to
an AI (Claude/Cursor) would easily let it understand the structure and build the base first,
much easier than guessing the structure.

In the Amazon PRD, the technical requirements listed tech features and why they existed. I
think this makes a strong PRD, especially if you hand it off to AI to do the bulk of the
creating, so it understands the context more, which benefits the project significantly. Story
Time had a very in-depth user flow that showed the user lifecycle start to finish, which was
very helpful in understanding how the concept works and will help AI tremendously. Another
benefit of the Amazon PRD was that it had visuals of how it actually worked for the customer,
which also helped me understand it better.

What made the Amazon PRD weaker was that it did not have a clearly defined user flow, start to
finish. The Amazon PRD had user personas, which threw me off a little — why name two customers
who would ideally use the product when it targets a huge audience, instead of two people with
a specific problem and pain point? I almost thought they were the developers. The Amazon PRD
was also very vague in its key features, which is one of the most important parts. It didn't
go in depth, especially on the UI, the natural language processing, and the personalized
recommendations and how they should work. That's not enough to hand off, but it's still enough
to attempt to fill in the blanks yourself.

### 3. Claim
"User flow" and ERDs might be among the most important things to include in a PRD, especially
when building software with AI.

### 4. Question
Is the tech stack — the database, front end, and back end — really that important and
industry-standard, given that you could source it to many different options?

### 5. Reflection
After reading both PRDs, I could definitely build what I need to if they were handed off to me.
The one question is: how in-depth do PRDs need to be? I think the more in-depth you are —
especially with the tech stack, the user flow, and the ERDs — the better they are. That's what
made the clear winner, in my opinion: Story Time 2.0.
