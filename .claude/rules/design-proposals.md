# Design Proposals

## Lead with the ideal greenfield design

When proposing a design change, always describe the design you would choose
building from scratch — on its own terms, independent of migration cost.

Additionally propose a brownfield migration path when migrating to the
greenfield design either (a) has scope beyond a single PR, or (b) is
backwards-incompatible. The migration path covers the incremental steps and
their sequencing from current state to the greenfield design.

Never default to an inferior design because of migration effort. Migration cost
informs how to get there, not what to aim for; present the greenfield design
and the migration path as separate proposals.
