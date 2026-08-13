---
section: "3.4"
title: "Analytics migration to ClickHouse"
summary: "Fourteen billion rows moved under a dual-write cutover. Zero downtime, and one rollback executed cleanly at 02:40."
slug: "olap-migration"
state: complete
stack: ["ClickHouse", "Kafka Connect", "Airflow"]
result: ["14B rows", "query p95 9.4 s to 380 ms"]
---

This implementation note is **listed but not written**. The index carries its summary, its
stack and the numbers it produced. The constraints, decisions, measurements and named
failure modes are not yet migrated.

Principle 4.8 says an architecture is not presented without its failure mode, so this page
does not present one until it can.
