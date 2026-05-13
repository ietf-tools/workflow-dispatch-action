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
  const runRef = await gh.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
    owner,
    repo,
    workflow_id: workflow,
    ref,
    inputs,
    headers: {
      'X-GitHub-Api-Version': '2026-03-10'
    }
  }).then(r => r.data)
  info(`Workflow dispatched as run ID ${runRef.workflow_run_id} on ${Temporal.Now.instant().toString()} 🚀`)
  setOutput('workflowRunId', runRef.workflow_run_id)
  setOutput('workflowRunUrl', runRef.html_url)

  if (showRunUrl) {
    info(` └── Follow progress at ${runRef.html_url}`)
  }

  // Wait for completion

  if (waitForCompletion) {
    info('Waiting for workflow run completion... ⏳\n')

    const startInstant = Temporal.Now.instant()
    const maxInstant = Temporal.Now.instant().add(Temporal.Duration.from({ milliseconds: waitForCompletionTimeout }))

    let keepWaiting = true
    while (keepWaiting) {
      await setTimeout(waitForCompletionInterval)

      // Query run state

      const diffTime = Temporal.Now.instant().since(startInstant, { smallestUnit: 'second' })
      info(`Querying workflow run status... (+${diffTime.toLocaleString()})`)
      const runState = await gh.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}', {
        owner,
        repo,
        run_id: runRef.workflow_run_id,
        headers: {
          'X-GitHub-Api-Version': '2026-03-10'
        }
      }).then(r => r.data)
      info(` └── Current state: ${runState.status}\n`)

      // Determine conclusion

      if (runState.status === 'completed') {
        keepWaiting = false
        setOutput('workflowRunResult', runState.conclusion)

        if (runState.conclusion !== 'success') {
          info(`Workflow run completed with conclusion: ${runState.conclusion} 🟥`)
          setFailed(`Workflow run completed with conclusion: ${runState.conclusion}`)
        } else {
          info(`Workflow run completed with conclusion: ${runState.conclusion} 🟢`)
        }
        info(` └── Total duration: ${diffTime.toLocaleString()}`)
      }

      // Check if exceeded max wait timeout

      if (keepWaiting && Temporal.Instant.compare(Temporal.Now.instant(), maxInstant) > 0) {
        keepWaiting = false
        setOutput('workflowRunResult', 'action_timed_out')
        setFailed('Workflow run has exceeded max wait timeout. It is still running but this action will no longer wait for its completion.')
      }
    }
  } else {
    setOutput('workflowRunResult', 'unknown')
  }
} catch (err) {
  console.error(err)
  setOutput('workflowRunResult', 'action_error')
  setFailed(err.message)
}
