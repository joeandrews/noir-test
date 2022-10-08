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
  serialise_acir_to_barrtenberg_circuit,
} from "@noir-lang/aztec_backend";

const acirHex =
  "cd933112823010454710905b7884842492743a6363eb7801c05529a460223d3790606ba9a3de88dbd80833b4b2055bfdeacffeb77f6bff5e3eb65176043399b7caea943d2f3fab3cd5a733e834a9abba599261432756659a25230bce210c80321a9140c552102ee285a4920a29f681640c2497a18a554814e50ce8412876f8d94c072f42caf73acd21d16901e56b975fb224d2709b3a6e97dee994dbe770adcd7010ceff1eb415ee4850a2c3b1118239081e1e6ecf9e9bac805c1b6f86fe57de0ce3af7ce432a024f3ab915cb257f30aa1e608b88d657f01";
const witnessHex =
  "a5cc090d00300800b1ecdfdc900c0178410d12718388ab80464b13e6775ce8c0854f5e2c5e6c5cc8e1c5e5c5e34501";
async function compute_partial_witnesses(circuit: any, abi: any) {
  // Use the ACIR representation to compute the partial witnesses

  // Assumption: .values() will always return the values in a deterministic order;
  // (from left to right) in the abi object

  let values: string[] = [];
  for (const [_, v] of Object.entries(abi)) {
    let entry_values = AnyToHexStrs(v);
    values = values.concat(entry_values);
  }

  return compute_witnesses(circuit, values);
}

function AnyToHexStrs(any_object: any): string[] {
  let values: string[] = [];
  if (Array.isArray(any_object)) {
    for (let variable of any_object) {
      values = values.concat(AnyToHexStrs(variable));
    }
  } else if (typeof any_object === "string" || any_object instanceof String) {
    // If the type is a string, we expect it to be a hex string
    let string_object = any_object as string;

    if (isValidHex(string_object)) {
      values.push(string_object);
    } else {
      // TODO: throw should not be in a library, but currently we aren't doing
      // TODO: much in terms of error handling
      throw new Error("strings can only be hexadecimal and must start with 0x");
    }
  } else if (Number.isInteger(any_object)) {
    let number_object = any_object as number;
    let number_hex = number_object.toString(16);
    // The rust code only accepts even hex digits
    let is_even_hex_length = number_hex.length % 2 == 0;
    if (is_even_hex_length) {
      values.push("0x" + number_hex);
    } else {
      values.push("0x0" + number_hex);
    }
  } else {
    throw new Error("unknown object type in the abi");
  }
  return values;
}

function isValidHex(hex_str: string): boolean {
  return !isNaN(Number(hex_str));
}
async function prove() {
  const wasm = await init("noir_wasm_bg.wasm");
  let acir = acir_from_bytes(new Uint8Array(Buffer.from(acirHex, "hex")));
  console.log(acir);
  await initBackend("aztec_backend_bg.wasm");

  const abi = {
    x: "00",
    y: "00",
    _return: "00",
  };

  // const witness = await compute_partial_witnesses(acir, abi);
  let witnessByteArray = new Uint8Array(Buffer.from(witnessHex, "hex"));

  const barretenberg_witness_arr = await packed_witness_to_witness(
    acir,
    witnessByteArray
  );
  console.log(barretenberg_witness_arr);
  const serialised_circuit = await serialise_acir_to_barrtenberg_circuit(acir);
  console.log(serialised_circuit);
  console.log(setup_generic_prover_and_verifier);
  let [prover, verifier] = await setup_generic_prover_and_verifier(
    serialised_circuit
  );
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
