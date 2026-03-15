const LC_HEADERS = { "Content-Type": "application/json", "Referer": "https://leetcode.com", "User-Agent": "Mozilla/5.0" };

function parseMaxStreak(matchedUser, currentYear) {
    if (!matchedUser) return 0;
    const allTimestamps = [];
    for (let y = 2015; y <= currentYear; y++) {
        const cal = matchedUser[`y${y}`]?.submissionCalendar;
        if (cal) {
            try {
                const parsed = JSON.parse(cal);
                allTimestamps.push(...Object.keys(parsed).map(Number));
            } catch { }
        }
    }
    allTimestamps.sort((a, b) => a - b);

    let maxStreak = 0;
    let currentStreak = 0;
    let previousDate = 0;

    for (const ts of allTimestamps) {
        if (currentStreak === 0) {
            currentStreak = 1;
            previousDate = ts;
        } else {
            const diffDays = Math.round((ts - previousDate) / 86400);
            if (diffDays === 1) {
                currentStreak++;
            } else if (diffDays > 1) {
                if (currentStreak > maxStreak) maxStreak = currentStreak;
                currentStreak = 1;
            }
            previousDate = ts;
        }
    }
    if (currentStreak > maxStreak) maxStreak = currentStreak;
    return maxStreak;
}

async function test(username) {
  const currentYear = new Date().getFullYear();
  let aliases = "";
  for (let y = 2015; y <= currentYear; y++) {
    aliases += `\n        y${y}: userCalendar(year: ${y}) { submissionCalendar }`;
  }

  const query = `
    query($username: String!) {
      matchedUser(username: $username) {
        userCalendar { streak totalActiveDays }${aliases}
      }
    }
  `;
  const res = await fetch("https://leetcode.com/graphql", { method: "POST", headers: LC_HEADERS, body: JSON.stringify({ query, variables: { username } }) });
  const json = await res.json();
  if (json?.data?.matchedUser) {
     const maxStreak = parseMaxStreak(json.data.matchedUser, currentYear);
     console.log(username, "maxStreak:", maxStreak, "apiStreak:", json.data.matchedUser.userCalendar?.streak);
  } else {
     console.log(username, "not found or error", JSON.stringify(json));
  }
}

async function run() {
    await test("omamar");
    await test("meng-hsuan");
}
run();
