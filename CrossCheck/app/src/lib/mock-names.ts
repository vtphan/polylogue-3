/**
 * Name pool for generating mock student data.
 * Diverse names reflecting Memphis middle school demographics.
 */

export const MOCK_FIRST_NAMES = [
  "Amari", "Brianna", "Caleb", "Destiny", "Elijah", "Faith",
  "Gabriel", "Hailey", "Isaac", "Jade", "Kendall", "Layla",
  "Mason", "Nadia", "Oscar", "Priya", "Quinton", "Ruby",
  "Sienna", "Theo", "Unique", "Victor", "Wesley", "Ximena",
  "Yasmin", "Zion", "Aaliyah", "Brandon", "Camille", "Darius",
  "Emani", "Franklin", "Grace", "Hakeem", "Imani", "Jaylen",
  "Kayla", "Liam", "Mya", "Noah", "Olivia", "Phillip",
  "Raven", "Sebastian", "Tamia", "Uriel", "Valentina", "William",
];

export const MOCK_LAST_NAMES = [
  "Williams", "Johnson", "Smith", "Brown", "Davis", "Jackson",
  "Harris", "Robinson", "Thompson", "Mitchell", "Anderson", "Taylor",
  "Thomas", "Moore", "Martin", "Lee", "Walker", "Hall",
  "Allen", "Young", "King", "Wright", "Lopez", "Hill",
  "Green", "Adams", "Baker", "Gonzalez", "Nelson", "Carter",
  "Patel", "Kim", "Chen", "Rivera", "Reed", "Brooks",
];

/**
 * Generate a list of unique mock student names.
 * Avoids collisions with existing display names.
 */
export function generateMockNames(
  count: number,
  existingNames: Set<string>
): string[] {
  const names: string[] = [];
  const used = new Set(existingNames);

  for (let i = 0; i < count; i++) {
    let name = "";
    let attempts = 0;

    while (attempts < 100) {
      const first = MOCK_FIRST_NAMES[Math.floor(Math.random() * MOCK_FIRST_NAMES.length)];
      const last = MOCK_LAST_NAMES[Math.floor(Math.random() * MOCK_LAST_NAMES.length)];
      const candidate = `${first} ${last}`;

      if (!used.has(candidate.toLowerCase())) {
        name = candidate;
        break;
      }
      attempts++;
    }

    // If still colliding after 100 attempts, append a number
    if (!name) {
      const first = MOCK_FIRST_NAMES[i % MOCK_FIRST_NAMES.length];
      const last = MOCK_LAST_NAMES[i % MOCK_LAST_NAMES.length];
      let suffix = 2;
      name = `${first} ${last} ${suffix}`;
      while (used.has(name.toLowerCase())) {
        suffix++;
        name = `${first} ${last} ${suffix}`;
      }
    }

    used.add(name.toLowerCase());
    names.push(name);
  }

  return names;
}
