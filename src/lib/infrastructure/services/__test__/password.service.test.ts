/**
 * PasswordService must keep verifying hashes produced by the previous
 * bcrypt-ts implementation, otherwise every existing account is locked out
 * after the switch to the native binding.
 */
import { describe, expect, it } from "vitest";
import { PasswordService } from "@/lib/infrastructure/services/password.service";
import { hashSync, genSaltSync, compareSync } from "bcrypt-ts";
import { verify as nativeVerify, hash as nativeHash } from "@node-rs/bcrypt";

describe("PasswordService", () => {
  const svc = new PasswordService();
  const password = "password123";

  async function newNativeHash() {
    return svc.hashPassword(password);
  }

  it("verifies a hash it produced", async () => {
    const hash = await newNativeHash();
    expect(await svc.comparePassword(password, hash)).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await newNativeHash();
    expect(await svc.comparePassword("wrong", hash)).toBe(false);
  });

  // Without this the switch to the native binding locks out every existing
  // account, because their hashes were produced by bcrypt-ts.
  it("still verifies legacy bcrypt-ts hashes", async () => {
    const legacy = hashSync(password, genSaltSync(10));
    expect(await svc.comparePassword(password, legacy)).toBe(true);
    expect(await svc.comparePassword("nope", legacy)).toBe(false);
  });

  it("is interchangeable with bcrypt-ts in both directions", async () => {
    const legacy = hashSync(password, genSaltSync(10));
    const native = await nativeHash(password, 10);
    expect(await nativeVerify(password, legacy)).toBe(true);
    expect(compareSync(password, native)).toBe(true);
    expect(compareSync("nope", native)).toBe(false);
  });

  it("produces standard bcrypt at the original cost factor", async () => {
    const hash = await newNativeHash();
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    expect(Number(hash.split("$")[2])).toBe(10);
  });
});
