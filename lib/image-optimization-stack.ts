import cdk = require("@aws-cdk/core");

import * as s3 from "@aws-cdk/aws-s3";
import { S3EventSource } from "@aws-cdk/aws-lambda-event-sources";
import { Function, Runtime, Code } from "@aws-cdk/aws-lambda";
import { FollowMode } from "@aws-cdk/assets";
import path = require("path");
import { Duration } from "@aws-cdk/core";

interface ImageOptimizationStackProps {
  inputBucket: string;
  outputBucket: string;
  filters: s3.NotificationKeyFilter[];
  environment: any;
}

export class ImageOptimizationStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: ImageOptimizationStackProps
  ) {
    super(scope, id, {});

    const { inputBucket, outputBucket, filters, environment } = props;

    // CREATE INPUT AND OUTPUT BUCKETS
    const bucket = new s3.Bucket(this, "RawImages", {
      bucketName: inputBucket,
      publicReadAccess: false,
    });
    const destination = new s3.Bucket(this, "OptimizedImages", {
      bucketName: outputBucket,
      publicReadAccess: true,
    });

    // LAMBDA CODE
    const code = Code.fromAsset(path.join(__dirname, "../lambda-fns/convert"), {
      follow: FollowMode.BLOCK_EXTERNAL,
    });
    const lambda = new Function(this, "ImageOptimizationLambda", {
      runtime: Runtime.NODEJS_10_X,
      code,
      handler: "lambda.handler",
      environment: {
        ...environment,
        DESTINATION_BUCKET: destination.bucketName,
      },
      memorySize: 1024,
      timeout: Duration.seconds(900),
    });

    // GRANT PERMISSIONS TO LAMBDA
    destination.grantReadWrite(lambda);
    bucket.grantReadWrite(lambda);

    // ADD S3 TRIGGERS AS LAMBDA INPUTS
    lambda.addEventSource(
      new S3EventSource(bucket, {
        events: [s3.EventType.OBJECT_CREATED, s3.EventType.OBJECT_REMOVED],
        filters, // optional
      })
    );
  }
}
