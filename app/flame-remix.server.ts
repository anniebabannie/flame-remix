import axios from 'axios'
import http from 'node:http'
import * as url from 'url';

const { IS_RUNNER, FLY_API_TOKEN, FLY_APP_NAME, FLY_IMAGE_REF, IS_LOCAL_DEV } = process.env
const port = 3000
const timeUntilStop = 5 * 60 * 1000
let exitTimeout: NodeJS.Timeout;

/*
  Process groups are ways to group Fly Machines by their start commands.
  Since our "runner" Machines will use a different start command than the rest of the app,
  we can set the process group here to target only the "runner" Machines.
*/

let processGroup:string;
if (FLY_IMAGE_REF && FLY_IMAGE_REF.includes(':deployment-')) {
  // @ts-ignore
  const deploymentId = FLY_IMAGE_REF.split(':deployment-').pop().toLocaleLowerCase()
  processGroup = `runner-${deploymentId}`
} else {
  processGroup = `runner-${new Buffer(FLY_IMAGE_REF!).toString('base64').toLocaleLowerCase()}`
}

/*
  Start a new axios instance for Fly.io's Machines API
  We'll use this to spawn new machines and check if there are any available runners
 */
const machinesService = axios.create({
  baseURL: `https://api.machines.dev/v1/apps/${FLY_APP_NAME}`,
  headers: { 'Authorization': `Bearer ${FLY_API_TOKEN}` }
})


/*
  Our `runnerBaseUrl` will be different depending on if we're running locally or on Fly.io
  When running on Fly.io, we'll use the internal DNS name of the "runner" Machines;
  This is allows us to access the "runner" Machines without exposing them to the public internet.
 */
let runnerBaseUrl;
if (IS_LOCAL_DEV) {
  runnerBaseUrl = `http://localhost:${port}`
} else {
  runnerBaseUrl = `http://${processGroup}.process.${FLY_APP_NAME}.internal:${port}`
}

/* 
  Start a new axios instance for accessing your "runner" Machines
*/
const runnerService = axios.create({ 
  baseURL: runnerBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
 })

/*
  Our `flame` function is a wrapper around the original function that we want to run on another machine.
  It returns one of two functions:
    1. If the current process is not a "runner" Machine, it boots up a new machine
    2. If the current process IS on a "runner" Machine, it returns the original function
  
  Important to note that this function always gets called TWICE: once on our original machine, and once on the "runner" machine.
*/

type FlameGuest = {
  cpu_kind: string,
  cpus: number,
  memory_mb: number
}
type FlameConfig = {
  path: string,
  guest: FlameGuest
}

export default function flame(originalFunc:Function, config: FlameConfig): Function {
  // If we're running on a "runner" machine, we'll just return the original function
  if (IS_RUNNER) {
    return originalFunc
  }

  // Get the filename of the file containing the original function
  // const filename = url.fileURLToPath(config.path);

  // If we're NOT on a "runner" machine, we'll return a new function that will spawn a new machine and then execute the original function
  return async function (...args: any[]) {
    if (!(await checkIfThereAreRunners())) {
      await spawnAnotherMachine(config.guest)
    }

    return await execOnMachine(config.path, args)
  }
}

/*
  This spins up a new "runner" machine. Here we're using Fly.io's Machines API to start a new machine with the same image as the current machine.
  If you aren't deploying a Fly app, you would simply replace this API call with the appropriate API call for your cloud provider.

  We're also setting the `IS_RUNNER` environment variable to `1` so that the new machine knows it's a "runner" machine.
  We're also setting the `processGroup` metadata so that we can target only the "runner" machines.
*/
async function spawnAnotherMachine(guest:FlameGuest) {

  // Start a new machine with the same image as the current machine
  const {data: machine} = await machinesService.post('/machines', {
    config: {
      auto_destroy: true,
      image: FLY_IMAGE_REF,
      guest,
      env: {
        IS_RUNNER: "1"
      },
      processes: [
        {
          name: "runner",
        }
      ],
      metadata: {
        fly_process_group: processGroup
      }
    }
  })

  // Set a timeout so our new machine doesn't run forever
  await machinesService.get(`/machines/${machine.id}/wait?timeout=60&state=started`)

  return machine
}

/*
  This checks if there are any "runner" machines available to run our code, using a simple GET request.
*/
async function checkIfThereAreRunners() {
  console.log("Checking if there are runners")
  try {
    const res = await runnerService.get('/')
    console.log("there are runners!!")
    return res.status === 200
  } catch (err) {
    console.log("there are NOO runners!!")
    return false
  }
}

/* 
  This function sends a POST request to the "runner" machine, which will result in our original function being executed.
  It sends the filename and arguments for the file containing our flame-wrapped function.
  It then returns the result of the execution.
*/
async function execOnMachine(filename:string, args:any[]) {
  console.log("executing on machine!!!!!!!!!")
  
  const execRes = await runnerService.post('/flame', {filename, args})
  console.log("execRes", execRes.data.result)
  // Return the result of our original function to the main app Machine
  return execRes.data.result
}

// This function schedules the "runner" Machine to stop after a certain amount of time
function scheduleStop() {
  clearInterval(exitTimeout)

  exitTimeout = setTimeout(() => {
    process.exit(0)
  }, timeUntilStop)

  console.info(`Server will stop in ${timeUntilStop}ms`)
}