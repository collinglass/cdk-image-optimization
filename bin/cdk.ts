#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { ImageOptimizationStack } from "../lib/image-optimization-stack";

const app = new cdk.App();

new ImageOptimizationStack(app, "ImageOptimizationStack", {
  inputBucket: "wtc-input-bucket",
  outputBucket: "wtc-output-bucket",
  filters: [],
  environment: {
    WIDTH: "1000",
    HEIGHT: "1000",
  },
});
