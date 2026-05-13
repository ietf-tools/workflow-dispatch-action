<div align="center">

<img src="https://raw.githubusercontent.com/ietf-tools/common/main/assets/logos/workflow-dispatch-action.svg" alt="Workflow Dispatch Github Action" height="125" />

[![Release](https://img.shields.io/github/release/ietf-tools/workflow-dispatch-action.svg?style=flat&maxAge=600)](https://github.com/ietf-tools/workflow-dispatch-action/releases)
[![License](https://img.shields.io/github/license/ietf-tools/workflow-dispatch-action)](https://github.com/ietf-tools/workflow-dispatch-action/blob/main/LICENSE)

##### Workflow Run Dispatch - Github Action

</div>

---

This GitHub Action triggers a workflow run in any repository and waits for its completion.

- [Inputs](#inputs)
- [Outputs](#outputs)
- [Completion States](#completion-states)
- [Example](#example)

> [!WARNING]
> You MUST create a GitHub Personal Access Token (PAT) with write access to the repository containing the workflow you want to trigger. You CANNOT use `${{ secrets.GITHUB_TOKEN }}` for the token as it doesn't have the necessary permissions.

## Inputs

| Field | Description | Required | Default |
|---|---|:----:|---|
| `repo` | Repo owner and name (e.g. `your-org/repo-name`) | :white_check_mark: |  |
| `workflow` | Name or ID of workflow to run (e.g. `deploy.yml`) | :white_check_mark: |  |
| `ref` | Branch, tag or commit SHA reference of the workflow run (e.g. `main`) | :x: | `main` |
| `token` | GitHub token with write access to the target repo (MUST be a PAT, NOT the GITHUB_TOKEN) | :white_check_mark: |  |
| `inputs` | Inputs to pass to the workflow as a JSON string. All values MUST be strings. (e.g. `{ "inputA": "true" }`) | :x: | `{}` |
| `showRunUrl` | If set to `true`, the URL to the workflow run will be shown in the output logs. | :x: | `true` |
| `waitForCompletion` | If set to `true`, the action will wait for the completion of the workflow run and report its completion state. Note that a `failure` (or any state other than `success`) will result in this action failing as well. | :x: | `true` |
| `waitForCompletionInterval` | How often to query the triggered worflow status (e.g. `30s` or `1m`) | :x: | `30s` |
| `waitForCompletionTimeout` | How long to wait before marking the workflow as timed out (e.g. `10m` or `1h`) | :x: | `10m` |

## Outputs

| Field               | Description                                                          | Example Value |
|---------------------|----------------------------------------------------------------------|---------------|
| `workflowRunResult` | The workflow run completion status *(see below for possible values)* | `success`     |
| `workflowRunId`     | The workflow run ID                                                  | `123`         |
| `workflowRunUrl`    | The workflow run URL                                                 | `https://..`  |

## Completion States

These are the possible values for the `workflowRunResult` output. Note that values starting with `dispatch_` are emitted directly by this action.

| Status             | Description                                                    |
|--------------------|----------------------------------------------------------------|
| `success`          | All jobs passed                                                |
| `failure`          | One or more jobs failed                                        |
| `cancelled`        | The run was cancelled                                          |
| `skipped`          | The run was skipped                                            |
| `timed_out`        | The run exceeded its time limit                                |
| `action_required`  | Manual action is required                                      |
| `neutral`          | Completed without a definitive pass/fail                       |
| `stale`            | Marked stale by GitHub after 14 days in an incomplete state    |
| `startup_failure`  | The runner failed to start up before the job could begin       |
| `dispatch_error`   | An error occured within this workflow dispatch action          |
| `dispatch_timeout` | The run has exceeded this workflow dispatch action max timeout |

## Example

``` yaml
name: Build

on:
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v7

      - name: Trigger Workflow XYZ
        uses: ietf-tools/workflow-dispatch-action@v1
        with:
          repo: your-org/repo-name
          workflow: deploy.yml
          ref: main
          token: ${{ secrets.PERSONAL_ACCESS_TOKEN }}
          inputs: '{ "inputA": "true", "inputB": "The internet is a series of tubes" }'
```
