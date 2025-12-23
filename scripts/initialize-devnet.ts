import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { readFileSync } from "fs";
import { PROGRAM_ID, CURVE_CONFIG_SEED, GLOBAL_SEED, TREASURY_VAULT_SEED } from "../app/src/lib/constants";

async function main() {
    // Load the provider
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    // Load the IDL
    const idl = JSON.parse(readFileSync("./target/idl/pump.json", "utf8"));
    const program = new Program(idl, provider);

    console.log("Program ID:", program.programId.toBase58());
    console.log("Admin:", provider.wallet.publicKey.toBase58());

    // Derive PDAs
    const [dexConfigPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from(CURVE_CONFIG_SEED)],
        program.programId
    );

    const [globalPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from(GLOBAL_SEED)],
        program.programId
    );

    const [treasuryVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from(TREASURY_VAULT_SEED)],
        program.programId
    );

    console.log("Initializing contract...");
    console.log("Dex Config PDA:", dexConfigPDA.toBase58());
    console.log("Global PDA:", globalPDA.toBase58());
    console.log("Treasury Vault PDA:", treasuryVaultPDA.toBase58());

    try {
        const tx = await program.methods
            .initialize(
                1.0, // 1% fee
                5000 // 50% paperhand tax
            )
            .accounts({
                dexConfigurationAccount: dexConfigPDA,
                globalAccount: globalPDA,
                treasuryVault: treasuryVaultPDA,
                admin: provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            } as any)
            .rpc();

        console.log("Success! Initialization transaction:", tx);
    } catch (err) {
        if (err.message.includes("already in use")) {
            console.log("Contract already initialized.");
        } else {
            console.error("Initialization failed:", err);
        }
    }
}

main().then(
    () => process.exit(),
    (err) => {
        console.error(err);
        process.exit(1);
    }
);
