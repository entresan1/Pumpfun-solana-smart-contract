import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { readFileSync } from "fs";
import { PROGRAM_ID, CURVE_CONFIG_SEED } from "../app/src/lib/constants";

async function main() {
    // Load the provider explicitly to avoid env var issues
    const connection = new anchor.web3.Connection("https://api.devnet.solana.com");
    const wallet = new anchor.Wallet(
        Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(readFileSync("./id.json", "utf8")))
        )
    );
    const provider = new anchor.AnchorProvider(connection, wallet, anchor.AnchorProvider.defaultOptions());
    anchor.setProvider(provider);

    // Load the IDL
    const idl = JSON.parse(readFileSync("./target/idl/pump.json", "utf8"));
    const program = new Program(idl, provider);

    console.log("Program ID:", program.programId.toBase58());
    console.log("Admin:", provider.wallet.publicKey.toBase58());

    // Derive Dex Config PDA
    const [dexConfigPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from(CURVE_CONFIG_SEED)],
        program.programId
    );

    // Treasury Wallet (User provided)
    const treasuryWallet = new PublicKey("Gi2GLxRgXgtd6pyb378AhA4hcBEjbP6aNFWCfFgaAGoS");

    console.log("Updating contract configuration...");
    console.log("Dex Config PDA:", dexConfigPDA.toBase58());
    console.log("New Treasury Wallet:", treasuryWallet.toBase58());

    try {
        const tx = await program.methods
            .updateConfiguration(
                treasuryWallet,
                null // Keep fees as is
            )
            .accounts({
                dexConfigurationAccount: dexConfigPDA,
                admin: provider.wallet.publicKey,
            } as any)
            .rpc();

        console.log("Success! Configuration updated. Transaction:", tx);
    } catch (err) {
        console.error("Update failed:", err);
    }
}

main().then(
    () => process.exit(),
    (err) => {
        console.error(err);
        process.exit(1);
    }
);
