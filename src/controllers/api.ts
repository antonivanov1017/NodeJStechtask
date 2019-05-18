"use strict";

import request from "request";
import fs from "fs";
import crypto from "crypto";
import { Response, Request, NextFunction } from "express";
import { Stream } from "stream";

export let getUser = (req: Request, res: Response, next: NextFunction) => {
  request
    .get(`https://reqres.in/api/users/${req.params.userId}`)
    .on("error", next)
    .pipe(res);
};

export let getUserAvatar = (req: Request, res: Response, next: NextFunction) => {
  const requestOptions: request.Options = {
    url: `https://reqres.in/api/users/${req.params.userId}`,
    json: true
  };

  const onGetUserSuccess: request.RequestCallback = (err: Error, response: request.Response, body: any) => {
    if (err) return next(err);

    const filePath = getFilePathFromUrl(body.data.avatar);
    
    fs.access(filePath, fs.constants.F_OK, (err) => {
      let fileStream: Stream = null;

      if (!err) {
        fileStream = fs.createReadStream(filePath, { encoding: "base64" });
      } else {
        fileStream = request
          .get(body.data.avatar)
          .on("error", next);
        // Write to file system
        fileStream.pipe(fs.createWriteStream(filePath));
        // At the same time, transform encoding and pipe to res
        fileStream = fileStream.pipe(new Stream.PassThrough().setEncoding("base64"));
      }

      fileStream.pipe(res);
    });
  };

  request.get(requestOptions, onGetUserSuccess);
};

export let deleteUserAvatar = (req: Request, res: Response, next: NextFunction) => {
  const requestOptions: request.Options = {
    url: `https://reqres.in/api/users/${req.params.userId}`,
    json: true
  };

  const onGetUserSuccess: request.RequestCallback = (err: Error, response: request.Response, body: any) => {
    if (err) return next(err);

    const filePath = getFilePathFromUrl(body.data.avatar);
    
    fs.unlink(filePath, (err) => {
      if (err) return next(err);
      res.json({ status: "success" });
    });
  };

  request.get(requestOptions, onGetUserSuccess);
};

let getFilePathFromUrl = (url: string): string => {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  return `uploads/${hash}`;
}