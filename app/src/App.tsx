import React from "react";
import logo from "./logo.svg";
import "./App.css";

import init, { acir_from_bytes } from "@noir-lang/noir_wasm";
import {
  setup_generic_prover_and_verifier,
  verify_proof,
  create_proof_with_witness,
} from "@noir-lang/barretenberg/dest/client_proofs";
import initBackend, {
  packed_witness_to_witness,
  serialise_public_inputs,
  compute_witnesses,
} from "@noir-lang/aztec_backend";

const acirHex =
  "cd933112823010454710905b7884842492743a6363eb7801c05529a460223d3790606ba9a3de88dbd80833b4b2055bfdeacffeb77f6bff5e3eb65176043399b7caea943d2f3fab3cd5a733e834a9abba599261432756659a25230bce210c80321a9140c552102ee285a4920a29f681640c2497a18a554814e50ce8412876f8d94c072f42caf73acd21d16901e56b975fb224d2709b3a6e97dee994dbe770adcd7010ceff1eb415ee4850a2c3b1118239081e1e6ecf9e9bac805c1b6f86fe57de0ce3af7ce432a024f3ab915cb257f30aa1e608b88d657f01";
const witnessHex =
  "a5cc090d00300800b1ecdfdc900c0178410d12718388ab80464b13e6775ce8c0854f5e2c5e6c5cc8e1c5e5c5e34501";

async function prove() {
  const wasm = await init("noir_wasm_bg.wasm");
  let acir = acir_from_bytes(new Uint8Array(Buffer.from(acirHex, "hex")));
  console.log(acir);
  await initBackend("aztec_backend_bg.wasm");

  let witnessByteArray = new Uint8Array(Buffer.from(witnessHex, "hex"));
  const barretenberg_witness_arr = await packed_witness_to_witness(
    acir,
    witnessByteArray
  );
  console.log(barretenberg_witness_arr);
  let [prover, verifier] = await setup_generic_prover_and_verifier(acir);
  console.log("created prover and verifier");

  const proof = await create_proof_with_witness(
    prover,
    barretenberg_witness_arr
  );
  console.log("proof: " + proof.toString("hex"));

  const verified = await verify_proof(verifier, proof);
  console.log(verified);
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <button onClick={prove}>Prove</button>
      </header>
    </div>
  );
}

export default App;
