[![gojosatorou375-source's GitHub stats](https://github-readme-stats.vercel.app/api?username=gojosatorou375-source)](https://github.com/anuraghazra/github-readme-stats)

# Hido (LiquidPrivacy)

> A software-defined privacy screen built with Electron, TypeScript, and HTML5 Canvas that protects sensitive information from shoulder surfing through a dynamic, physics-driven privacy overlay.

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active%20Development-blue" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
  <img src="https://img.shields.io/badge/Electron-Latest-47848F" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6" />
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-black" />
</p>

<p align="center">
  <img src="https://skillicons.dev/icons?i=electron,ts,nodejs,html,css,vscode,git" />
</p>

---

## Overview

Hido (LiquidPrivacy) is a desktop utility designed to reduce visual data exposure in public and shared environments.

Unlike traditional privacy filters, Hido uses a software-defined approach that dynamically masks screen content while maintaining a clear viewing area for the primary user. The result is a privacy system that adapts to user interaction and device movement without degrading display quality.

---

## Motivation

Professionals frequently work from:

* Cafés
* Airports
* Co-working spaces
* Public transit
* Open office environments

In these settings, sensitive information is vulnerable to shoulder surfing and visual data leakage.

Physical privacy screens provide partial protection but introduce several drawbacks:

* Reduced brightness
* Color distortion
* Fixed viewing angles
* Poor adaptability

Hido explores a software-first alternative.

---

## Features

### Physics-Driven Privacy Overlay

A custom mass-spring simulation engine powers a dynamic liquid privacy layer that responds naturally to movement and interaction.

### IMU Sensor Integration

Real-time device orientation data can be consumed through IMU hardware integration, allowing the overlay to react to physical screen tilt and movement.

### Intelligent Fallback System

When IMU hardware is unavailable, Hido automatically transitions to a cursor-based tracking model that preserves the adaptive privacy experience.

### Click-Through Overlay Architecture

Electron's native window APIs allow the privacy layer to remain visible while forwarding all user input directly to underlying applications.

### Ice Mode

An enhanced privacy mode that introduces viewport polarization and localized attenuation to further restrict side-angle visibility.

### Live Configuration Sandbox

A dedicated preview environment enables real-time tuning of physics parameters, opacity values, dampening coefficients, and motion sensitivity.

---

## Architecture

```text
User Input / IMU Sensors
           │
           ▼
Overlay Physics Engine
           │
           ▼
Canvas Rendering System
           │
           ▼
Privacy Mask Generation
           │
           ▼
Fullscreen Click-Through Overlay
```

---

## Tech Stack

| Layer              | Technology   |
| ------------------ | ------------ |
| Desktop Framework  | Electron     |
| Language           | TypeScript   |
| Runtime            | Node.js      |
| Rendering          | HTML5 Canvas |
| Sensor Integration | node-imu     |
| UI                 | HTML5 / CSS3 |

---

## Technical Challenges

* Real-time physics simulation
* Hardware telemetry integration
* High-performance canvas rendering
* Cross-platform desktop compatibility
* Non-blocking overlay window management
* Adaptive privacy viewport calculations

---

## Roadmap

* Eye-tracking integration
* Multi-monitor support
* Ambient light adaptation
* GPU-accelerated rendering
* Enterprise policy management
* AI-assisted focus detection

---

## License

MIT License

---

This format looks much closer to repositories from companies like [Vercel](https://vercel.com?utm_source=chatgpt.com), [Electron](https://www.electronjs.org?utm_source=chatgpt.com), and [Supabase](https://supabase.com?utm_source=chatgpt.com)—minimal, technical, and recruiter-friendly.


<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=blur&height=200&color=gradient&text=Hido&fontSize=90&fontAlignY=40&animation=fadeIn" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active%20Development-blue" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
  <img src="https://img.shields.io/badge/Electron-Latest-47848F" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6" />
  <img src="https://img.shields.io/badge/Platform-Windows%20|%20macOS%20|%20Linux-black" />
</p>

<p align="center">
  <img src="https://skillicons.dev/icons?i=electron,typescript,nodejs,html,css,git,vscode" />
</p>

<h1 align="center">Hido (LiquidPrivacy)</h1>

<p align="center">
  A software-defined privacy screen powered by real-time physics simulation,
  adaptive viewport masking, and hardware-aware interaction.
</p>
