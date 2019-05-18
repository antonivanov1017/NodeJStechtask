import { schedule, ScheduledTask } from "node-cron";
import fs from "fs";
import request from "request";

let task: ScheduledTask = null;

export interface IUser {
  id: number,
  email: string,
  first_name: string,
  last_name: string,
  avatar: string
};

const readFromJSON = async (): Promise<any> => {
  const promise: Promise<any> = new Promise((resolve: Function) => {
    const onReadFileFinished = (err: Error, data: Buffer): void => {
      let json: any = {};
  
      if (!err && data !== null) {
        json = JSON.parse(data.toString());
      }
  
      resolve(json);
    };
  
    fs.readFile("users.json", onReadFileFinished);
  });

  return promise;
};

const scrapNextPage = async (users: any): Promise<any> => {
  const promise: Promise<any> = new Promise((resolve: Function, reject: Function) => {
    users.data = users.data || [];

    const nextPage = users.data.length + 1;
    const options: request.Options = {
      url: `https://reqres.in/api/users?page=${nextPage}`,
      json: true
    };

    const onGetPageFinished: request.RequestCallback = (err: Error, response: request.Response, body: any): void => {
      if (err) return reject(err);

      if (body.data.length === 0) {
        console.log("Scraping finished successfully!");
        task.stop();
      } else {
        console.log(`Page ${nextPage}:`, body.data);
        users.data.push(body);
      }

      resolve(users);
    };

    request.get(options, onGetPageFinished);
  });

  return promise;
};

const writeToJSON = async (users: any): Promise<any> => {
  const promise: Promise<any> = new Promise((resolve: Function, reject: Function) => {
    const onWriteFileFinished = (err: Error): void => {
      if (err) {
        reject(err);
      }
      resolve(users);
    };

    fs.writeFile("users.json", JSON.stringify(users), onWriteFileFinished);
  });

  return promise;
};

const handleError = (err: Error): void => {
  console.error(err);

  task.stop();
};

const handleJob = (): void => {
  readFromJSON()
    .then(scrapNextPage)
    .then(writeToJSON)
    .catch(handleError);
};

task = schedule("* * * * *", handleJob);
