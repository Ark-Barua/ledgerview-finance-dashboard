import { createHash } from "node:crypto";

// SHA-256 of normalized rows from the retired seed files, in their original insertion order.
const fingerprints = {
  "transactions": [
    "961e69977aa57a6b44f81d1d6fbd9b1457663e18e1993998534e06f43c80e359",
    "4fda76f20c330a25e467e58953fc022a37d71601416fd5b2d9085383befaba9a",
    "0db59dae9a291b4190b97b870b5f5860955d5e5215c0828abf8a23163c9e90b5",
    "cdb11e83ca1ead1d1ec749897c50d99e682d9c106bb138504ebd550e68354eff",
    "0bb9e981bd6bb0cb4e7ed09a024e5076fb635a901f458c4d766d5eecb1887896",
    "ef28f42233b4da8045856632193075386d948046dde57e67a5e2444c487b5365",
    "197172ff4bf4ef95eb1403131103696ba243c3ce8737cc82a6ec02256155f620",
    "533878a796da15dbae3e405342e5a16d5853dff97990b9fc097781079f1c2625",
    "d7320b7c0777afebed5c1c2c85a6a087000aab290eced5a95325688bb8e1ae82",
    "c10bd6664de04278cb251176600dbe3828eddc62b39375ab99d8f9a723c798c2",
    "301b702eb948e9e9d46c9a9374c31ffc6864fbc4d1365935c2ca4e9cbdd32eb7",
    "627057fbb1196c6ba68844470003cb7ecc2078f6a20ce76ad70ad9efd0c93d1f",
    "12bbacf20cddff0f0d72b2bfef4c896bd1a208dbe493d009e8be1729d311fd99",
    "0431ebce474eeab2d8dd635865707ffa3147c0c19bfcc1a1d316ac5e1bd6e949",
    "3dd27ef32b968f8f3b984442aff04646178b7bdf43895e3ff317135bc4ae405c",
    "8c2fce987cd2a6c3c17f0a960ff9783b0451044c5e468404a62968f54f94a398",
    "f7cece06b12d709cda322ae087759cbd9afba9e1e79f35d54fa0016fdb240c8e",
    "18ffb751a4861b874314744acdc218c9ede2a5e596ac2efaa1ce9c7a8dd7597c",
    "221c6b2cda381de149583553cd99c65467c17690c57b884f213ba426abfeb3c2",
    "476a700dc22f05341326fd60b03c3eb5c9f107616eef5d2c45443dbcaab2fec2",
    "718d950e8c7a6868d54d01288c170bc1c5a95bab6653e49a8b3dac529e7ca9bf",
    "d34f34d4cec18139aefd6f6af7db6e94ce33fb9487cb9cec980a7934d68fcf84",
    "0c17c49b2c3febf96667b4f91e28c338485d8a76338be4bd6081bf42fab64ca9",
    "33039eeda8ebaa1d8c9adb9cc5873a774003726361cb067b4381bfc18ee24188",
    "0239bd1f74dd3acbf46094cbcb29bdb055dfe6f11674a24fc72ebcc2c79c07c6",
    "8d3d9ef621c0dde70346fcca5b92a949eb12eed4bc27e06d16de3ef2798216c0"
  ],
  "workspaceEvents": [
    "c37535fd480dcf6b1150e1bfba415e4999aaaa9098b09d0432a222fd615ee1d9",
    "d42815399e7da3fada9dfaaad7bc033eb1fc863822370422998d87b5d8af629f",
    "4e35b02453151db15f526a376a7f9ab518f93b9f51c59a9bcb26b025ddb27b1b"
  ],
  "assetWorkflows": [
    "009ae2676a9a6c59c3054dbd03296266e9c6b2f807ac043d78a840474a94b257",
    "a219af867e3e7812665deaa0ee84e418d50f7cd4f08d23e2b9d8567201e95748",
    "7434599dbea6c3919ec7b126b25ba790cc579281b402b24b6bad76e4821eb09a"
  ],
  "financeNotes": [
    "932d1d48524e420f42e000a0f3f46d8f329e27caaf60889c384e3cb5885885c5",
    "a6ac26b7f0a25e538b2b680c22f2056c429a06d71618f1007bd1a20a4ac5db29"
  ],
  "workspaceFiles": [
    "0ce9666fb321568ece1e3683149a32d01804bb04f025d04d1a02c9c6fd9d5d4e",
    "75233d1d991599a2374dcc9744e345145bdb324b8d7e006be0b30f6fb4ce462c",
    "39076164f600f8b086d1c3857fe0024b40d03ee730b6c80e0fdf048873e8ddee"
  ],
  "documents": [
    "4da3e44ba6e0bffc51485f58dbe33bdbd1815dbf444e5e8dc105253cd3f7a108",
    "5fa0c8ab0f55ddad501505b2d471bb030ff2974fad8ece800de26eb64c8e22fd",
    "ca2c2ebf7908d9db15a210204fcdb4773a4aaed85063247eec15d299bd77e894"
  ],
  "reports": [
    "71ba6a006002407c74614887f603aacf897e41d0685364943128fd3ccf2ad860",
    "702bafa56d9cbfa54459a7cb9335f3a1bafc40b188db063997a8030525a90892",
    "a62b81d48fc4acb71943e79fd1055e776373c1db2c4b3f978dbd8dec6ab7bcd7"
  ]
};

function signature(body) {
  return createHash("sha256").update(body).digest("hex");
}

export function isLegacySample(kind, originalId, normalized) {
  return fingerprints[kind]?.[originalId - 1] === signature(JSON.stringify(normalized));
}

export function removeSeededBatches(db) {
  const offsets = new Map();
  let index = 0;
  for (const [kind, hashes] of Object.entries(fingerprints)) {
    for (const hash of hashes) offsets.set(kind + hash, index++);
  }
  const remove = db.prepare("DELETE FROM records WHERE id=?");
  const select = db.prepare("SELECT id,kind,body FROM records WHERE workspace=? ORDER BY id");
  for (const workspace of db.prepare("SELECT id FROM workspaces").all()) {
    const batches = new Map();
    for (const row of select.all(workspace.id)) {
      const position = offsets.get(row.kind + signature(row.body));
      if (position === undefined) continue;
      const start = row.id - position;
      if (!batches.has(start)) batches.set(start, []);
      batches.get(start).push(row.id);
    }
    // Require corroborating rows from the same original insertion sequence.
    // A later hand-entered transaction can legitimately match a sample's contents.
    const ranked = [...batches.values()].sort((a, b) => b.length - a.length);
    const [original, runnerUp] = ranked;
    if (original?.length >= 2 && original.length > (runnerUp?.length ?? 0)) {
      for (const id of original) remove.run(id);
    }
  }
}
