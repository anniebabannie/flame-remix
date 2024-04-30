import { ActionFunctionArgs, json } from "@remix-run/node";
import { response } from "express";

export async function action({ request }: ActionFunctionArgs) {
  console.log('running actionnnnnn')
  const body = await request.json();
  console.log("body", body)
  console.log(body.filename)
  console.log(body.args)
  const mod = await import(`../${body.filename}.server.ts`)
  const result = await mod.default(...body.args);
  console.log('results of math')
  console.log(result)
  return json({ status: 200, result});
}

export async function loader() {
  console.log("The runner machine is alive!") 
  return json({ status: 200, message: "Hello, world!"});
}