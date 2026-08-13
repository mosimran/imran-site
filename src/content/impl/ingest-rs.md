---
section: "3.3"
title: "Ingest path rewrite, PHP to Rust"
summary: "Identical semantics. Verified by replaying ninety days of production traffic through both implementations and diffing the outputs byte for byte."
slug: "ingest-rs"
state: production
stack: ["Rust (tokio)", "RabbitMQ", "PostgreSQL", "MinIO"]
result: ["89% fewer nodes", "p99 340 ms to 11 ms"]
---

This implementation note is **listed but not written**. The index carries its summary, its
stack and the numbers it produced. The constraints, decisions, measurements and named
failure modes are not yet migrated.

Principle 4.8 says an architecture is not presented without its failure mode, so this page
does not present one until it can.
