# Demo Video Script

This document contains a **6.5-7 minute English speaking script** and a **scene-by-scene storyboard** for the final submission video.

## Recording Goals

The video must clearly demonstrate:

- full application functionality across user and admin flows
- a clear explanation of the implementation
- the AWS service workflow
- the CI/CD process
- the live public website

## Recording Setup

- Recommended final duration: **6:30 to 7:00**
- Recommended speaking style: calm, slow, and clear
- Recommended format: short edited cuts instead of one continuous recording
- Recommended final file path in the repo: `docs/demo-video.mp4`

## Full Script With Scene Notes

### 0:00 - 0:35

**Script**

Hello, my name is Truong Tran Gia Phuc, student ID 23080430. This project is called **Cloud-Native Travel Booking Microservice**. In this video, I will demonstrate three things: first, the main functionality of the application; second, the implementation and microservice architecture; and third, the AWS deployment workflow and CI/CD pipeline that are used to run the system online.

**Scene to record**

- Open the public GitHub repository root page
- Show the top of the README
- Make sure the project title, live demo link, and evidence pack link are visible

**Backup visual**

- `docs/evidence/01-github-repo-public.png`

---

### 0:35 - 1:05

**Script**

I will start by showing that the application is publicly available through a custom domain. The live website is served through a cloud deployment path that goes from Name.com DNS to Amazon CloudFront, then to an internet-facing Application Load Balancer, and finally to the frontend service running on Amazon ECS Fargate.

**Scene to record**

- Open `https://www.phuctruongtrangiaa.app/login`
- Show the login page
- Briefly switch to the register page and return to login

**Backup visual**

- `docs/evidence/02-live-login-page.png`

---

### 1:05 - 1:55

**Script**

Now I will log into the system and show the main user-facing functionality. After authentication, the application provides a protected dashboard and several business areas. Users can browse available flights, inspect flight details, start a booking flow, review their bookings, and access wallet-related payment features. This frontend is implemented as a React and Vite single-page application served through nginx, and nginx proxies requests to dedicated backend services instead of a single monolithic server.

**Scene to record**

- Log in with a working account
- Show dashboard
- Open flights list
- Open one flight detail page

**Key points to mention while navigating**

- login and protected routes
- flight browsing
- flight detail
- frontend talking to dedicated backend services

---

### 1:55 - 2:45

**Script**

Next, I will demonstrate the booking and payment-related parts of the application. A user can open the booking creation flow, choose a flight and a seat, continue through the booking process, then review booking details and access wallet-based payment capabilities. The implemented capabilities in the codebase include booking creation, booking listing, booking detail, booking cancellation, wallet top-up requests, and wallet payment support.

**Scene to record**

- Open booking creation page
- Show seat selection or booking form
- Open bookings list
- Open one booking detail page
- Open wallet page

**Backup visuals**

- `docs/evidence/13-dashboard-or-booking-page.png`
- `docs/evidence/14-dashboard-or-booking-page.png`

---

### 2:45 - 3:30

**Script**

This system also includes admin-facing functionality. Admin users can manage users, inspect passenger information, manage airports and aircraft data, and work with payment reconciliation or wallet review flows. This is important because the system is not only a public booking website, but also an operational microservice platform with both end-user and admin capabilities.

**Scene to record**

- Navigate quickly through admin-only pages:
  - users
  - passengers
  - airports or aircraft
  - payments reconcile page

**What to emphasize**

- role-protected pages
- business operations beyond simple login and booking

---

### 3:30 - 4:20

**Script**

I will now explain the implementation. The system is built as a microservices architecture with five main backend services: identity, flight, passenger, booking, and payment, plus the frontend. RabbitMQ is used for asynchronous domain events and cross-service workflow coordination. Redis is used as the backend for distributed rate limiting and request throttling. Persistent data is stored in PostgreSQL on Amazon RDS. In practical terms, identity publishes user-related events and the passenger service consumes them to synchronize passenger profiles. Payment success or payment expiry events are consumed by the booking service, and booking cancellation can trigger seat release and refund-related workflows.

**Scene to record**

- Return to the README architecture section
- Show the architecture diagram
- Scroll a little to show service responsibilities and tech stack

**What to emphasize**

- frontend through nginx
- 5 backend services
- RabbitMQ for async workflows
- Redis for rate limiting
- RDS PostgreSQL for persistence

---

### 4:20 - 5:20

**Script**

Next, I will show the AWS service workflow used in the live deployment. The custom domain is managed through Name.com. Traffic is routed to Amazon CloudFront, which acts as the public distribution layer. CloudFront forwards traffic to the internet-facing Application Load Balancer. The ALB then reaches the frontend service running on Amazon ECS Fargate. The backend microservices also run on ECS Fargate, container images are stored in Amazon ECR, and the database runs on Amazon RDS PostgreSQL. This gives the project a real cloud deployment rather than only a local or simulated environment.

**Scene to record**

- Show `docs/evidence/03-namecom-dns-mapping.png`
- Show `docs/evidence/04-cloudfront-alt-domains.png`
- Show `docs/evidence/05-cloudfront-origin-alb.png`
- Show `docs/evidence/10-ecs-services-healthy.png`
- Show `docs/evidence/11-ecr-repositories.png`
- Show `docs/evidence/12-rds-instance.png`

**Optional extra**

- If time allows, briefly show `docs/evidence/06-cloudfront-security-alb.png`

---

### 5:20 - 6:15

**Script**

I will now explain the CI/CD process. This repository uses GitHub Actions with AWS OIDC-based authentication. When code is pushed to the main branch, the workflow called **Main Build Release** determines which services changed, builds the relevant Docker images, pushes them to Amazon ECR, and generates a release manifest. After that, the **Deploy Staging** workflow downloads the manifest, runs migration tasks, registers new ECS task definition revisions, updates the ECS services, and finally runs smoke checks through the public URL. This means the deployment pipeline is automated and connected to the real cloud environment.

**Scene to record**

- Show `docs/evidence/06-github-actions-success.png`
- Show `docs/evidence/07-github-actions-success.png`
- Show `docs/evidence/08-github-actions-success.png`
- Show `docs/evidence/09-github-actions-success.png`

**Optional live code scene**

- Briefly open:
  - `.github/workflows/main-build-release.yml`
  - `.github/workflows/deploy-staging.yml`

**What to emphasize**

- push to `main`
- build and push to ECR
- manifest upload
- ECS deployment
- smoke verification

---

### 6:15 - 6:45

**Script**

To conclude, this project demonstrates a working cloud-native travel booking system with microservices, public web access, AWS deployment, and CI/CD automation. It includes both user-facing and admin-facing functionality, event-driven service coordination with RabbitMQ, rate limiting with Redis, persistent storage on Amazon RDS, and container deployment on Amazon ECS Fargate. Thank you for watching.

**Scene to record**

- Return to the live app dashboard or the top of the README
- Hold the final frame for a few seconds before stopping the recording

---

## Shot List Summary

| Time | Segment | Main Scene |
| --- | --- | --- |
| 0:00-0:35 | Opening | GitHub repo + README top |
| 0:35-1:05 | Public access | Live login page on custom domain |
| 1:05-1:55 | User flow part 1 | Login, dashboard, flights, flight detail |
| 1:55-2:45 | User flow part 2 | Booking create, booking detail/list, wallet |
| 2:45-3:30 | Admin flow | Users, passengers, airports/aircraft, payments reconcile |
| 3:30-4:20 | Implementation | README architecture diagram + service responsibilities |
| 4:20-5:20 | AWS workflow | Name.com, CloudFront, ALB, ECS, ECR, RDS evidence |
| 5:20-6:15 | CI/CD | GitHub Actions success screenshots and workflow explanation |
| 6:15-6:45 | Closing | Live app or README top section |

## Delivery Tips

- Keep the cursor movement calm and deliberate
- Do not read file paths line by line
- Avoid making claims about technologies not used in the project
- If a live page is slow, cut to the prepared evidence screenshot instead of waiting
- If one admin page fails to load during recording, continue the narration and use the next available admin page
- Speak slightly slower than normal conversation speed to stay clear and professional

## Do Not Claim in the Video

- Amazon EKS
- Istio
- Terraform
- Route 53
- Kafka

Use only the stack that is actually implemented and evidenced in the repository and deployment.
