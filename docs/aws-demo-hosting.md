# AWS demo hosting

The manual `Deploy browser demo to AWS` workflow publishes the Vue and Angular static demos to S3 behind CloudFront. Both use the in-browser demo engine. It does not deploy the ASP.NET API or a database, so it does not create always-on compute or database costs.

## Cost and account requirements

Use only an AWS account whose plan reports `FREE` and `ACTIVE`. The workflow checks this through the AWS Free Tier API and stops before uploading anything when the check fails. AWS says free-plan accounts do not see charges when they exceed free usage, though the service can restrict use. This account plan is available only to eligible new AWS customers, so an existing paid account will not pass the check. [AWS Free Tier FAQ](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier-FAQ.html)

This deployment uses only S3 and CloudFront's AWS Free Tier offers. It does not use the CloudFront flat-rate plan, paid DNS, custom paid logging, Lambda, API Gateway, or a database. New AWS customers receive 5 GB S3 storage, 20,000 GET requests, and 2,000 PUT requests per month for one year. CloudFront has an Always Free allowance of 1 TB data transfer and 10 million requests per month. The workflow is manual and uses one S3 sync and one invalidation per run. [S3 Free Tier](https://aws.amazon.com/s3/faqs/), [CloudFront Free Tier](https://aws.amazon.com/free/networking/)

The real .NET API still needs a persistent SQL Server database. This repository does not deploy either one, since AWS compute and a managed database cannot be guaranteed free for every account. The live demo continues to use the browser-only demo engine on GitHub Pages.

## One-time setup

Create a private S3 bucket and a CloudFront distribution using Origin Access Control. Keep it on the normal Free Tier allowances. Do not attach a CloudFront flat-rate plan, paid WAF features, a custom domain, or paid logging.

Create a GitHub Actions IAM role trusted through GitHub OIDC. Limit its trust policy to this repository and the `main` branch. Grant only `freetier:GetAccountPlanState`, `s3:ListBucket`, `s3:PutObject`, `s3:DeleteObject`, and `cloudfront:CreateInvalidation` on the demo bucket and distribution.

Set the repository secret `AWS_ROLE_TO_ASSUME` to that role ARN and the repository variables `AWS_DEMO_BUCKET` and `AWS_DEMO_DISTRIBUTION_ID` to the bucket name and distribution ID. Then run the workflow manually from the Actions tab.

The workflow is manual so pushes cannot publish to an AWS account unexpectedly. It uses GitHub OIDC and stores no AWS access keys in GitHub.
