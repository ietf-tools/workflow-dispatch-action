import { getInput, getBooleanInput, info, setFailed, setOutput } from '@actions/core'
import { getOctokit } from '@actions/github'
import ms from 'ms'
import { Temporal } from '@js-temporal/polyfill'
import { setTimeout } from 'node:timers/promises'

try {
  // Get Inputs

  const [owner, repo] = getInput('repo', { required: true }).split('/')
  const workflow = getInput('workflow', { required: true })
  const ref = getInput('ref')
  const token = getInput('token', { required: true })
  const inputs = JSON.parse(getInput('inputs', { required: true }))

  const showRunUrl = getBooleanInput('showRunUrl')
  const waitForCompletion = getBooleanInput('waitForCompletion')
  const waitForCompletionInterval = ms(getInput('waitForCompletionInterval'))
  const waitForCompletionTimeout = ms(getInput('waitForCompletionTimeout'))

  if (waitForCompletionInterval > waitForCompletionTimeout) {
    throw new Error('waitForCompletionInterval cannot be longer than waitForCompletionTimeout!')
  }

  const gh = getOctokit(token)

  // Trigger workflow

  info('Dispatching workflow...')
  const runRef = await gh.rest.actions.createWorkflowDispatch({
    owner,
    repo,
    workflow_id: workflow,
    ref,
    inputs
  })
  info(`Workflow dispatched as run ${runRef.workflow_run_id} on ${Temporal.Now.instant().toString()} 🚀`)
  setOutput('workflowRunId', runRef.workflow_run_id)
  setOutput('workflowRunUrl', runRef.html_url)

  if (showRunUrl) {
    info(` └── Follow progress at ${runRef.html_url}`)
  }

  // Wait for completion

  if (waitForCompletion) {
    info('Waiting for workflow run completion...')

    const maxInstant = Temporal.Now.instant().add(Temporal.Duration.from({ milliseconds: waitForCompletionTimeout }))

    let keepWaiting = true
    while (keepWaiting) {
      await setTimeout(waitForCompletionInterval)

      // Query run state

      info('Querying workflow run status...')
      const runState = await gh.rest.actions.getWorkflowRun({
        owner,
        repo,
        run_id: runRef.workflow_run_id
      })
      info(` └── Current state: ${runState.status}`)

      // Determine conclusion

      if (runState.status === 'completed') {
        keepWaiting = false
        info(`Workflow run completed with conclusion: ${runState.completion}`)
        setOutput(workflowRunResult, runState.completion)

        if (runState.completion !== 'success') {
          setFailed(`Workflow run completed with conclusion: ${runState.completion}`)
        }
      }

      // Check if exceeded max wait timeout

      if (keepWaiting && Temporal.Duration.compare(Temporal.Now.instant(), maxInstant) > 0) {
        keepWaiting = false
        setOutput('workflowRunResult', 'action_timed_out')
        setFailed('Workflow run has exceeded max wait timeout. It is still running but this action will no longer wait for its completion.')
      }
    }
  } else {
    setOutput('workflowRunResult', 'unknown')
  }
} catch (err) {
  setOutput('workflowRunResult', 'action_error')
  setFailed(err.message)
}
