# Azure Dev Environment Using Typescript Terraform Cloud Development Kit

- docs here: <https://developer.hashicorp.com/terraform/cdktf>
- cdktf repo here: <https://github.com/hashicorp/terraform-cdk>
- cdktf azurerm provider repo here: <https://github.com/cdktf/cdktf-provider-azurerm>
- typescript cdktf azure example: <https://github.com/hashicorp/terraform-cdk/tree/main/examples/typescript/azure>

The cdktf is infrastructure as software (IaS) that generates terraform infrastructure as code (IaC) JSON.  This provides the ability to abstract the terraform out into building blocks so that you get the declarative benefits of IaC and the programmatic benefits of software composure.

---

Some advice to make the cdktf as beneficial as possible is to use the normal Terraform paradigms that have been proven to work for all sizes of infrastructure.  These include:

- keep a flat file structure
- stay very declarative
- keep things as simple as possible
- only add abstractions when needed
- keep following this pattern until you can’t or have a good reason not to

---

Notes:

- The cdktf makes use of [constructs](https://developer.hashicorp.com/terraform/cdktf/concepts/constructs).  Constructs are how the cdktf abstracts out parts of the IaS for composure and reuse.  Think of constructs as building blocks that can be any size. A construct can be:
  - a single Terraform [resource](https://developer.hashicorp.com/terraform/cdktf/concepts/resources)
  - a collection of resources bundled together into a [stack](https://developer.hashicorp.com/terraform/cdktf/concepts/stacks) (a stack is equivalent to a terraform working directory)
  - a Terraform [module](https://developer.hashicorp.com/terraform/cdktf/concepts/modules)
    - Some Azure modules here: <https://registry.terraform.io/browse/modules?provider=azurerm>
- Stacks are intended to be a solution for reusable Terraform infrastructure
- You can choose to [design custom constructs](https://developer.hashicorp.com/terraform/cdktf/develop-custom-constructs/construct-design) if you need to do something in a programming language that Terraform might not normally be able to do.
- The construct and cloud development kit concepts are not unique to Terraform: <https://constructs.dev/>
- cdktf seems to have every Azure resource that the normal Terraform Azurerm provider has
- Once you synthesize the cdktf into normal Terraform JSON, you no longer need to use cdktf, you could choose to use normal terraform to plan, diff and/or apply at that point.
- An azure terraform state solution like this might be beneficial: <https://learn.microsoft.com/en-us/azure/developer/terraform/store-state-in-azure-storage?tabs=azure-cli>
- infracost can be found here: <https://github.com/infracost/infracost>

---

cdktf commands:

- `cdktf --version` - get the version
- `cdktf --help` - get help with most commands and see what options are available
- `cdktf init` - used to start a new cdktf project from a template
- `cdktf provider add <provider...>` - Add one or more Terraform providers to your project.  Don't add a provider manually.
- `cdktf get` - Generate CDK Constructs for Terraform providers and modules.
- `cdktf convert` command that can convert a terraform HCL file to a cdktf project in the language chosen.  It kind of works, but needs some manual fixing afterward.
- `cdktf synth` - creates a terraform json IaC in the cdktf.out folder by default
- `cdktf list` - lists the stacks that are in the project
- `ckdtf apply [stacks...]` - deploy the given stacks
- `ckdtf destroy [stacks...]` - destroy the given stacks

Terraform commands that cdktf can also do (you could use normal terraform instead if you prefer).

- `cdktf diff` - does a synth and then a diff on it for drift detection
- `cdktf plan` - does a synth and then a play on it to see what changes will be made when an apply is done
- `ckdtf apply` - does a synth and they a terraform apply on it
- `ckdtf destroy` - does a synth and a terraform destroy on it
