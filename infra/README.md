# infra

Infrastructure-as-code definitions for the BlackRoad OS operator.

## Rule

> All infrastructure is declared here. No manual provisioning.

## Structure

```
infra/
└── README.md   # This file (populated as infra is codified)
```

## Principles

- **Declarative**: Every resource is defined in code, not clicked into existence.
- **Reviewed**: All infra changes go through a PR.
- **Idempotent**: Applying the same definition twice produces the same result.

## Getting Started

Infrastructure tooling (Terraform, Pulumi, etc.) and workspace layout will be
added here as the control plane matures. Until then, no infra changes should be
applied without a corresponding file in this directory.
