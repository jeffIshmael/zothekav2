export type RedditAttestation = {
  url: string;
  title: string;
  topic: "forex" | "payments" | "banking" | "remittance";
};

/** Real r/Malawi posts linked from reddittweets.md
 *  NOTE: these were sourced for the old USD/forex story. Consider replacing
 *  with threads about Spotify pricing / plan-splitting, or removing this
 *  section, now that the product is Spotify-split only. */
export const REDDIT_ATTESTATIONS: RedditAttestation[] = [
  {
    url: "https://www.reddit.com/r/Malawi/comments/1uexxpc/forex_exchange/",
    title: "Forex Exchange",
    topic: "forex",
  },
  {
    url: "https://www.reddit.com/r/Malawi/comments/1rq0qf3/bringing_dollars_into_malawi/",
    title: "Bringing Dollars into Malawi",
    topic: "remittance",
  },
  {
    url: "https://www.reddit.com/r/Malawi/comments/1ukfeg2/experience_with_nbm_on_forex_application/",
    title: "Experience with NBM on forex application",
    topic: "banking",
  },
];

export const PROBLEM_POINTS = [
  {
    title: "Individual Premium costs more per head",
    body: "Paying alone means covering the full Spotify Premium price yourself, when a shared plan could cost you a fraction of that.",
  },
  {
    title: "Family and Duo plans need someone to collect",
    body: "Splitting a plan the informal way means one person fronting the cost and chasing 1–5 people for their share every month.",
  },
  {
    title: "No easy way to prove who's paid",
    body: "Without a clear record, it's hard to know who's covered their share this month and who hasn't.",
  },
  {
    title: "Adding accounts to a shared plan is manual",
    body: "Someone has to collect each person's Spotify account email and add it to the plan by hand, every time membership changes.",
  },
];

/** The two ways people use Zotheka to get onto Spotify */
export const TWO_PILLARS = [
  {
    id: "start",
    label: "Starting a plan",
    title: "Pick a package, split it your way",
    summary:
      "Choose Solo, Duo, or Family. Duo and Family plans can be paid solo or split with peers — you decide.",
    steps: [
      "Choose your package: Solo, Duo, or Family",
      "For Duo or Family, choose to pay it solo or split it with peers",
      "If splitting, pick how many people — the cost divides automatically",
      "Pay your own share via mobile money",
      "Get a link to share with the rest of your peers",
    ],
    examples: ["Solo", "Duo", "Family"],
  },
  {
    id: "join",
    label: "Joining a plan",
    title: "Open the link, pay your share",
    summary:
      "Got a link from a friend? Pay just your part in Kwacha and share your Spotify email to get added.",
    steps: [
      "Open the link a peer shared with you",
      "Pay your share in Kwacha via mobile money",
      "Share your Spotify account email",
      "Get added to the plan once your payment goes through",
    ],
    examples: ["No card needed", "Keep your own account", "Pay only your share"],
  },
] as const;

export const ABOUT_SECTIONS = [
  {
    heading: "What is Zotheka?",
    body:
      "Zotheka helps Malawians pay for Spotify Premium using Kwacha on mobile money — and split the cost of Duo and Family plans with the people they already share subscriptions with.",
  },
  {
    heading: "Four packages, your choice",
    body:
      "Solo packages are single accounts, paid in full by one person. Duo (2 accounts) and Family (6 accounts) can be paid solo too, or split across as many people as the package allows.",
  },
  {
    heading: "Splitting is built in, not informal",
    body:
      "When you choose to split a Duo or Family package, pick how many people are sharing it and Zotheka divides the cost automatically. Pay your own share first, and you'll get a link to send to the rest of your group.",
  },
  {
    heading: "Peers join with a link",
    body:
      "Anyone you send the link to can open it, pay their share in Kwacha via mobile money, and submit their own Spotify account email. As each person pays, their account gets added to the plan — no manual chasing, no spreadsheets.",
  },
  {
    heading: "Built for Malawi",
    body:
      "Zotheka is designed around how Malawians actually move money: mobile money in, transparent shares, and a way to split subscriptions with people you trust without one person carrying the whole cost.",
  },
  {
    heading: "Get in touch",
    body: "Questions about your package, a payment, or a link that isn't working? Email support@zotheka.com.",
  },
];