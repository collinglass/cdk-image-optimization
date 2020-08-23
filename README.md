# Image Optimization

This is an example CDK stack to do Image Optimization asynchronously on s3 uploads. It sets up an input bucket and an output bucket, a lambda that uses the sharp library to optimize images, and a lambda trigger that triggers the lambda on every upload to the input bucket.

![Architecture](https://raw.githubusercontent.com/collinglass/cdk-image-optimization/master/img/architecture.jpeg)

## Development

_Lambda Setup_

The image conversion library uses native libraries, it needs to be built for the linux platform.

```
$ cd lambda-fns/convert
$ npm i
$ rm -rf node_modules/sharp
$ npm install --arch=x64 --platform=linux sharp
```

_Stack Installation and Deployment_

```
$ npm i
$ cdk bootstrap aws://<aws-account-id>/<aws-region>
$ npm run build && cdk deploy '*' --require-approval 'never' --profile <aws-profile>
```

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npm run deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
