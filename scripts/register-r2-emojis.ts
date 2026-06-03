import { db } from "../src/lib/db";
import { customEmojis } from "../src/lib/infrastructure/drizzle/schema";
import { createId } from "@paralleldrive/cuid2";

/**
 * Script to register emojis hosted on R2.
 * Usage: RUN: npx tsx scripts/register-r2-emojis.ts
 */

const BASE_URL = "https://assets.komunikasi.qzz.io/emoji";

// Format: { folder: "nama_folder", files: ["file1.gif", "file2.png"] }
const EMOJI_BATCH = [
    {
        category: "Emoji Kucing",
        folder: "emoji_kucing",
        files: [
            "1135-imgoingcrazy.gif",
            "1251-cute2.gif",
            "13654-catpaws.gif",
            "1412-typingcat.gif",
            "1499-vibecat.gif",
            "1545-catpopup.gif",
            "1615-catdance.gif",
            "2164-jigglin.gif",
            "2335-catcuddle.gif",
            "2579-cat-yipee.gif",
            "2792-lightmodecat.gif",
            "3414-cat-bitting.gif",
            "34636-catalert.gif",
            "3467-cat-combing.gif",
            "35636-huh.gif",
            "3568-catkiss.gif",
            "3581-cat-dead.gif",
            "37023-catsuit.gif",
            "4745-cat-leave.gif",
            "4852-catshake.gif",
            "4958-catmlem.gif",
            "5634-sadcat.gif",
            "666930-catrun.gif",
            "6988-melmcat.gif",
            "797336-catbunnyears.gif"
        ]
    },
    {
        category: "Emoji Meme",
        folder: "emoji_meme",
        files: [
            "110325-dogekidcar.gif",
            "208730-sasd.png",
            "235787-igotthis.png",
            "293919-mikestare.png",
            "416019-walterjam.gif",
            "421191-barbierock.gif",
            "441721-whitehamstersus.png",
            "461042-whats-face.png",
            "471166-zmechol.gif",
            "539926-catexplode.gif",
            "552347-whitekitty.png",
            "621207-catsmirk.gif",
            "659384-kitty.png",
            "672068-evilplanning.png",
            "68986-soldierhamster.png",
            "720199-same-think.gif",
            "744936-evilsmirk.png",
            "7845-goofyassemojicreaturelol.png",
            "959255-purple-rigby.gif"
        ]
    },
];

async function main() {
    console.log("🚀 Starting Emoji Registration...");

    for (const batch of EMOJI_BATCH) {
        for (const filename of batch.files) {
            // Hilangkan extensi untuk shortcode
            const nameOnly = filename.split(".")[0];
            const shortcode = `:${nameOnly}:`;
            const url = `${BASE_URL}/${batch.folder}/${filename}`;
            const isStatic = !filename.endsWith(".gif");

            try {
                await db.insert(customEmojis).values({
                    id: createId(),
                    shortcode,
                    url,
                    category: batch.category,
                    isStatic,
                }).onConflictDoUpdate({
                    target: customEmojis.shortcode,
                    set: { url, category: batch.category, isStatic, updatedAt: new Date() }
                });

                console.log(`✅ Registered ${shortcode} -> ${url}`);
            } catch (err) {
                console.error(`❌ Failed to register ${shortcode}:`, err);
            }
        }
    }

    console.log("✨ Done!");
    process.exit(0);
}

main();
