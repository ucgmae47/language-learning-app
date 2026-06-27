import type { WordEntry } from "@/lib/word-of-the-day/bank";

export function buildWotdEmailHtml(entry: WordEntry, date: string): string {
  const formattedDate = new Date(date + "T12:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric" },
  );

  const genderBadge =
    entry.gender === "masculine"
      ? '<span style="color:#64748b;font-size:13px;margin-left:4px">m.</span>'
      : entry.gender === "feminine"
        ? '<span style="color:#64748b;font-size:13px;margin-left:4px">f.</span>'
        : "";

  const ipaBadge = entry.ipa
    ? `<span style="display:inline-block;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:20px;padding:2px 10px;font-size:12px;color:#64748b;margin-top:6px">${entry.ipa}</span>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Your Spanish Word of the Day</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;text-align:center">
              <span style="display:inline-flex;align-items:center;gap:8px">
                <span style="display:inline-block;width:36px;height:36px;background:#059669;border-radius:10px;line-height:36px;text-align:center;font-size:18px">📖</span>
                <span style="font-size:18px;font-weight:700;color:#0f172a">LinguaPath</span>
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border:1px solid #d1fae5;border-radius:20px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">

              <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#059669">
                Word of the Day · ${formattedDate}
              </p>

              <h1 style="margin:12px 0 0;font-size:36px;font-weight:800;color:#0f172a;letter-spacing:-0.5px">
                ${entry.word}${genderBadge}
              </h1>

              <div style="margin-top:8px">
                <span style="display:inline-block;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:20px;padding:3px 12px;font-size:12px;color:#475569;font-weight:500">${entry.partOfSpeech}</span>
                ${ipaBadge}
              </div>

              <p style="margin:20px 0 0;font-size:15px;line-height:1.6;color:#334155">
                ${entry.definition}
              </p>

              <!-- Example -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:#f8fafc;border-radius:12px;padding:16px">
                <tr>
                  <td>
                    <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;line-height:1.6">
                      &ldquo;${entry.exampleEs}&rdquo;
                    </p>
                    <p style="margin:6px 0 0;font-size:13px;color:#64748b;font-style:italic;line-height:1.5">
                      ${entry.exampleEn}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <div style="margin-top:28px;text-align:center">
                <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://linguapath.app"}/dashboard"
                   style="display:inline-block;background:#059669;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:40px">
                  Continue learning →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;text-align:center;font-size:12px;color:#94a3b8">
              <p style="margin:0">LinguaPath · Personalized Spanish for B1–B2 learners</p>
              <p style="margin:4px 0 0">
                <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://linguapath.app"}/settings/notifications"
                   style="color:#94a3b8;text-decoration:underline">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildWotdEmailText(entry: WordEntry, date: string): string {
  const formattedDate = new Date(date + "T12:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric" },
  );

  return [
    `LinguaPath — Word of the Day · ${formattedDate}`,
    "",
    `${entry.word} (${entry.partOfSpeech})`,
    entry.ipa ? entry.ipa : "",
    "",
    entry.definition,
    "",
    `"${entry.exampleEs}"`,
    entry.exampleEn,
    "",
    "Continue learning: " +
      (process.env.NEXT_PUBLIC_APP_URL ?? "https://linguapath.app") +
      "/dashboard",
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}
