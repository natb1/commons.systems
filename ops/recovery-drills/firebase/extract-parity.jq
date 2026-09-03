# extract-parity.jq — extract the `landing` hosting contract from firebase.json
# into a normalized parity checklist, so the drill verifies the substitute host
# against a machine-generated projection of the source of truth rather than a
# hand-transcribed copy.
#
# Run:
#   jq -f ops/recovery-drills/firebase/extract-parity.jq firebase.json \
#     > ops/recovery-drills/firebase/parity-checklist.json
#
# Output shape:
#   {
#     target, document_root,
#     header_rules: [ { source, headers: [ {key, value} ] } ],
#     rewrites:     [ { source, destination|null, function|null } ]
#   }
#
# The committed parity-checklist.json is this script's output augmented with a
# `test_cases` array and a `webmention_stub` note (see parity-checklist.md) that
# describe HOW to probe each rule; those two additions are not derivable from
# firebase.json and are maintained by hand.

.hosting[]
| select(.target == "landing")
| {
    target: .target,
    document_root: .public,
    header_rules: [
      .headers[]
      | { source: .source,
          headers: [ .headers[] | { key: .key, value: .value } ] }
    ],
    rewrites: [
      .rewrites[]
      | { source: .source,
          destination: (.destination // null),
          function: (.function.functionId // null) }
    ]
  }
