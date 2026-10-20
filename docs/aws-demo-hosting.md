# AWS demo hosting

The manual `Deploy browser demo to AWS` workflow publishes the Vue and Angular static demos to S3 behind CloudFront. Both use the in-browser demo engine. It does not deploy the ASP.NET API or a database, so it does not create always-on compute or database costs.

## Cost and account requirements

Use a CloudFront **Free flat-rate plan** for the distribution. AWS currently lists that plan at $0/month with no overage charges, with a baseline allowance of 1 million requests and 100 GB of data transfer per month. The plan includes 5 GB of S3 storage credits. Above the allowance, AWS says performance can be reduced; the plan does not add overage fees. A CloudFront Free plan cannot be attached to an AWS account that is currently on the AWS Free Tier account plan. Check the account plan before provisioning. [CloudFront flat-rate plans](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/flat-rate-pricing-plan.html)

This is a browser-only demo. The real .NET API still needs a persistent SQL Server database; this repository does not provision one because a managed SQL database cannot be promised at $0 for every AWS account. AWS Lambda has an Always Free monthly allowance, but requests beyond the allowance can be billed on a paid account. [AWS Free Tier account plans](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier.html), [Lambda pricing](https://aws.amazon.com/lambda/pricing/)

## One-time setup

Create an S3 bucket with public access blocked, a CloudFront distribution using Origin Access Control, and a CloudFront Free flat-rate subscription associated with the distribution and its WAF web ACL. CloudFront pricing-plan subscriptions require a global-scope WAF web ACL in `us-east-1`. Enable the Free plan before using the site. Do not select a paid plan.

Create a GitHub Actions IAM role trusted through GitHub OIDC. Limit its trust policy to this repository and the `main` branch. Grant only `s3:ListBucket`, `s3:PutObject`, `s3:DeleteObject`, and `cloudfront:CreateInvalidation` on the demo bucket and distribution.

Set the repository secret `AWS_ROLE_TO_ASSUME` to that role ARN and the repository variables `AWS_DEMO_BUCKET` and `AWS_DEMO_DISTRIBUTION_ID` to the bucket name and distribution ID. Then run the workflow manually from the Actions tab.

The workflow is manual so pushes cannot publish to an AWS account unexpectedly. It uses GitHub OIDC and stores no AWS access keys in GitHub.
