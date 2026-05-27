import { db } from "../src/lib/db";
import { users } from "../src/lib/infrastructure/drizzle/schema";
import { or, isNull, eq } from "drizzle-orm";
import { generateKeyPair } from "crypto";

async function generateKeys(): Promise<{ publicKey: string; privateKey: string }> {
    return new Promise((resolve, reject) => {
        generateKeyPair("rsa", {
            modulusLength: 2048,
            publicKeyEncoding: { type: "spki", format: "pem" },
            privateKeyEncoding: { type: "pkcs8", format: "pem" }
        }, (err, pub, priv) => {
            if (err) reject(err);
            else resolve({ publicKey: pub, privateKey: priv });
        });
    });
}

async function runMigration() {
    console.log("Starting key generation migration...");

    // Find users who have empty or null keys
    const usersToUpdate = await db.select().from(users).where(
        or(
            isNull(users.privateKey),
            eq(users.privateKey, ""),
            isNull(users.publicKey),
            eq(users.publicKey, "")
        )
    );

    console.log(`Found ${usersToUpdate.length} users needing key generation.`);

    for (const user of usersToUpdate) {
        console.log(`Generating keys for: ${user.username} (${user.id})...`);
        try {
            const { publicKey, privateKey } = await generateKeys();
            await db.update(users)
                .set({ publicKey, privateKey })
                .where(eq(users.id, user.id));
            console.log(`Successfully updated ${user.username}.`);
        } catch (err) {
            console.error(`Failed to generate keys for ${user.username}:`, err);
        }
    }

    console.log("Migration complete.");
    process.exit(0);
}

runMigration().catch(err => {
    console.error(err);
    process.exit(1);
});
