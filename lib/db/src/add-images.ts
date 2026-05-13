/**
 * add-images.ts — Adds SVG diagram images to ~25% of questions
 * Run: pnpm --filter @workspace/db exec tsx src/add-images.ts
 */
import { Pool } from "pg";

const DB_URL = process.env.DATABASE_URL!;
if (!DB_URL) throw new Error("DATABASE_URL not set");
const pool = new Pool({ connectionString: DB_URL });

const SVGs: Record<string, string> = {
  Physics: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="#f0f4ff" rx="8"/><defs><marker id="a" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#0A1F5C"/></marker></defs><line x1="30" y1="100" x2="260" y2="100" stroke="#0A1F5C" stroke-width="2" marker-end="url(#a)"/><line x1="150" y1="30" x2="150" y2="170" stroke="#0A1F5C" stroke-width="2" marker-end="url(#a)"/><circle cx="150" cy="100" r="42" fill="none" stroke="#0D7377" stroke-width="2.5"/><text x="155" y="88" font-size="11" fill="#0A1F5C" font-family="Arial">v</text><text x="268" y="105" font-size="10" fill="#333" font-family="Arial">x</text><text x="153" y="25" font-size="10" fill="#333" font-family="Arial">y</text><text x="60" y="185" font-size="9" fill="#555" font-family="Arial">Uniform circular motion</text></svg>`,
  Chemistry: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="#f0fff4" rx="8"/><circle cx="100" cy="110" r="28" fill="#0D7377" opacity="0.15" stroke="#0D7377" stroke-width="2"/><circle cx="200" cy="110" r="28" fill="#C9A84C" opacity="0.15" stroke="#C9A84C" stroke-width="2"/><circle cx="150" cy="65" r="22" fill="#0A1F5C" opacity="0.15" stroke="#0A1F5C" stroke-width="2"/><line x1="100" y1="110" x2="200" y2="110" stroke="#555" stroke-width="2.5"/><line x1="100" y1="110" x2="150" y2="65" stroke="#555" stroke-width="2.5"/><line x1="200" y1="110" x2="150" y2="65" stroke="#555" stroke-width="2.5"/><text x="78" y="115" font-size="13" fill="#0D7377" font-family="Arial" font-weight="bold">C</text><text x="207" y="115" font-size="13" fill="#C9A84C" font-family="Arial" font-weight="bold">O</text><text x="143" y="58" font-size="13" fill="#0A1F5C" font-family="Arial" font-weight="bold">H</text><text x="75" y="185" font-size="9" fill="#555" font-family="Arial">Molecular bonding diagram</text></svg>`,
  Mathematics: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="#fff8f0" rx="8"/><line x1="20" y1="160" x2="280" y2="160" stroke="#333" stroke-width="1.5"/><line x1="150" y1="10" x2="150" y2="175" stroke="#333" stroke-width="1.5"/><path d="M30,160 Q150,20 270,160" fill="none" stroke="#0D7377" stroke-width="2.5"/><circle cx="150" cy="90" r="4" fill="#C9A84C"/><text x="157" y="86" font-size="10" fill="#C9A84C" font-family="Arial">(h,k)</text><line x1="80" y1="160" x2="220" y2="160" stroke="#0A1F5C" stroke-width="2" stroke-dasharray="5"/><text x="268" y="165" font-size="9" fill="#333" font-family="Arial">x</text><text x="154" y="15" font-size="9" fill="#333" font-family="Arial">y</text><text x="80" y="190" font-size="9" fill="#555" font-family="Arial">Parabola: y = ax² + bx + c</text></svg>`,
  Biology: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="#f5fff5" rx="8"/><ellipse cx="150" cy="105" rx="85" ry="65" fill="#0D7377" opacity="0.1" stroke="#0D7377" stroke-width="2"/><ellipse cx="150" cy="105" rx="38" ry="28" fill="#0A1F5C" opacity="0.15" stroke="#0A1F5C" stroke-width="1.5"/><circle cx="128" cy="83" r="7" fill="#C9A84C" opacity="0.7"/><circle cx="172" cy="93" r="6" fill="#C9A84C" opacity="0.7"/><circle cx="155" cy="127" r="8" fill="#C9A84C" opacity="0.7"/><text x="108" y="185" font-size="9" fill="#555" font-family="Arial">Eukaryotic cell (schematic)</text></svg>`,
};

function toDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function main() {
  const client = await pool.connect();
  try {
    let total = 0;
    for (const [subject, svg] of Object.entries(SVGs)) {
      const uri = toDataUri(svg);
      const r = await client.query(
        `UPDATE question_bank.question_bank
         SET image_url = $1, updated_at = NOW()
         WHERE subject = $2
           AND image_url IS NULL
           AND abs(hashtext(id::text)) % 4 = 0`,
        [uri, subject],
      );
      const count = r.rowCount ?? 0;
      total += count;
      console.log(`  [${subject}] Added images to ${count} questions`);
    }
    console.log(`\n✅ Done: ${total} questions now have SVG diagrams.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
