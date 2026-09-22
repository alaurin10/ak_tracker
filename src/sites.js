// Each counter the Worker serves, picked by the hostname it's visited on.
// Every site keeps its own count in KV under `kvKey`.
export const SITES = [
  {
    id: "alaska",
    hosts: ["ak.andrewlaurin.com"],
    kvKey: "state",
    person: "Maddi",
    place: "Alaska",
    resetLabel: "She mentioned it",
    emoji: "🏔️",
  },
  {
    id: "banff",
    hosts: ["banff.andrewlaurin.com"],
    kvKey: "state:banff",
    person: "Dom",
    place: "Banff Sunshine Village",
    resetLabel: "Dom mentioned it",
    emoji: "⛷️",
  },
];

// The site for a request. `?site=<id>` overrides the hostname, which is handy
// on the workers.dev address and in local dev. Unknown hosts get the first site.
export function siteFor(url) {
  const byId = SITES.find((s) => s.id === url.searchParams.get("site"));
  const byHost = SITES.find((s) => s.hosts.includes(url.hostname));
  return byId || byHost || SITES[0];
}
