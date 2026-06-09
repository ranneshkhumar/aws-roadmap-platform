import { QuizQuestion } from '@/constants/roadmapData';

export const generateQuizQuestionsForModule = (moduleId: string, moduleName: string): QuizQuestion[] => {
  const templates = [
    {
      question: `What is the primary architectural purpose of ${moduleName}?`,
      options: [
        `Automated provisioning and system backups.`,
        `Failsafe identity access and resources governance.`,
        `Low latency, secure file sharing.`,
        `Dynamic horizontal resource scaling.`
      ],
      answerIndex: 1,
      explanation: `${moduleName} provides policies and configurations specifically targeting cloud architecture structure, security limits, or resource orchestration.`
    },
    {
      question: `Which of the following is considered a core operational best practice for ${moduleName}?`,
      options: [
        `Granting root admin controls to all API callers.`,
        `Configuring open endpoints without authorization blocks.`,
        `Applying the principle of least privilege.`,
        `Avoiding access key rotations to preserve runtime consistency.`
      ],
      answerIndex: 2,
      explanation: `The principle of least privilege ensures users/roles only obtain the minimum permissions required for their actions, minimizing breach radius.`
    },
    {
      question: `How does ${moduleName} handle unexpected service interruptions or failures?`,
      options: [
        `By scaling down the entire fleet to prevent storage locks.`,
        `By utilizing automated multi-AZ standby failover replication.`,
        `By triggering manual shell restart triggers.`,
        `By transferring files to local backup endpoints.`
      ],
      answerIndex: 1,
      explanation: `AWS uses Multi-Availability Zone redundancy patterns to execute failover updates synchronously when primary databases or computing nodes crash.`
    },
    {
      question: `Which monitoring metrics should be configured to alert on abnormal activity in ${moduleName}?`,
      options: [
        `Network throughput, storage capacity, and IAM API actions.`,
        `Total number of active edge files only.`,
        `Local system memory cache constraints.`,
        `Standard billing alerts only.`
      ],
      answerIndex: 0,
      explanation: `Monitoring networking metrics alongside access patterns (via tools like CloudWatch and CloudTrail) is vital to identify anomalies.`
    },
    {
      question: `What is the shared responsibility of the customer regarding ${moduleName}?`,
      options: [
        `Patching the physical hypervisor firmware.`,
        `Securing data-in-transit, configurations, and IAM rules.`,
        `Recycling server hardware in the physical data centers.`,
        `Maintaining network switch wiring configurations.`
      ],
      answerIndex: 1,
      explanation: `AWS manages security OF the cloud (physical hosts and virtualization), while the customer handles security IN the cloud (configuration, data policy, OS patches).`
    },
    {
      question: `What mechanism does ${moduleName} utilize to authenticate trusted API requests?`,
      options: [
        `IAM Policies, Roles, and temporary Security Tokens.`,
        `Standard plaintext passwords stored in environment variables.`,
        `Public keys shared anonymously.`,
        `Static local IP tables matches.`
      ],
      answerIndex: 0,
      explanation: `AWS uses IAM roles and STS to dynamically generate short-lived credentials for applications, removing access keys leakage risks.`
    },
    {
      question: `Which option allows developers to provision ${moduleName} resources safely and repeatably?`,
      options: [
        `Manual configuration inside the AWS Console interface.`,
        `Using Infrastructure as Code (IaC) templates (Terraform/CloudFormation).`,
        `Running dynamic shell scripts without variable locks.`,
        `Writing custom python script hooks to compile API payloads.`
      ],
      answerIndex: 1,
      explanation: `IaC enables declarative definitions of resources that can be tracked in version control, verified, and safely deployed repeatedly.`
    },
    {
      question: `How is data stored inside ${moduleName} secured against unauthorized external access?`,
      options: [
        `By defaulting all permissions to public read-only.`,
        `By utilizing envelope encryption (KMS keys) and explicit resource policies.`,
        `By using external third-party firewalls.`,
        `By blocking all API access hooks.`
      ],
      answerIndex: 1,
      explanation: `AWS Key Management Service (KMS) combined with resource-level policies provides reliable data-at-rest encryption.`
    },
    {
      question: `Which service integrates with ${moduleName} to deliver global content caching?`,
      options: [
        `Amazon CloudFront CDN.`,
        `Amazon Glacier Backup.`,
        `Amazon RDS standbys.`,
        `AWS Systems Manager.`
      ],
      answerIndex: 0,
      explanation: `Amazon CloudFront caches static and dynamic assets at global edge locations to decrease delivery latency.`
    },
    {
      question: `How does ${moduleName} optimize operational costs automatically?`,
      options: [
        `By auto-terminating idle servers and setting database standby tier rules.`,
        `By capping API traffic thresholds.`,
        `By blocking read commands.`,
        `By compressing all text objects dynamically.`
      ],
      answerIndex: 0,
      explanation: `Leveraging lifecycle rules, auto-scaling thresholds, and serverless compute models optimizes resource allocation costs.`
    },
    {
      question: `Which command-line interface tool is used to manage ${moduleName}?`,
      options: [
        `The unified AWS CLI.`,
        `The Git terminal environment.`,
        `Standard SSH connections only.`,
        `Docker CLI commands.`
      ],
      answerIndex: 0,
      explanation: `The AWS CLI provides unified access to all AWS service API interfaces directly from local shell environments.`
    },
    {
      question: `What type of scaling is natively executed when resources under ${moduleName} adjust dynamically?`,
      options: [
        `Vertical scaling (increasing instance size).`,
        `Horizontal scaling (adding or removing instances).`,
        `Static allocation adjustments.`,
        `Manual storage attachment configurations.`
      ],
      answerIndex: 1,
      explanation: `Horizontal scaling (scaling out/in) matches traffic demands programmatically, minimizing compute overheads.`
    },
    {
      question: `Which compliance framework governs standard access protocols within ${moduleName}?`,
      options: [
        `The AWS Shared Responsibility Model.`,
        `Global ISO and SOC auditing standards.`,
        `Customer specific firewall rules.`,
        `Local server OS guidelines.`
      ],
      answerIndex: 1,
      explanation: `AWS environments are audited under various compliance programs (SOC 1/2/3, ISO 27001, PCI-DSS) to ensure security verification.`
    },
    {
      question: `What is the default policy stance for any new API action made in ${moduleName}?`,
      options: [
        `Implicit Deny.`,
        `Explicit Allow.`,
        `Read-Only Access.`,
        `Administrator Privilege.`
      ],
      answerIndex: 0,
      explanation: `AWS defaults to a secure-by-design policy posture where all requests are implicitly denied unless explicitly permitted by an IAM policy.`
    },
    {
      question: `What is the maximum execution time limit when serverless options are triggered via ${moduleName}?`,
      options: [
        `15 Minutes.`,
        `30 Seconds.`,
        `24 Hours.`,
        `Unlimited.`
      ],
      answerIndex: 0,
      explanation: `AWS serverless execution layers (like Lambda) enforce a hard timeout cap of 15 minutes per function invocation.`
    }
  ];

  return templates;
};
