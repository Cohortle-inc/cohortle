/**
 * Deployment Verification API Route
 * Returns deployment information for the frontend
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read deployment info from file if it exists
    const deploymentInfoPath = path.join(process.cwd(), 'deployment-info.json');
    let deploymentInfo = {
      deployed: true,
      buildTimestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'not-set',
      codeMarkers: [] as Array<{ file: string; marker: string }>
    };

    // Try to read deployment info file
    if (fs.existsSync(deploymentInfoPath)) {
      const fileContent = fs.readFileSync(deploymentInfoPath, 'utf8');
      deploymentInfo = { ...deploymentInfo, ...JSON.parse(fileContent) };
    }

    // Add code markers from key files
    const codeMarkers: Array<{ file: string; marker: string }> = [];
    
    // Check layout.tsx for deployment marker
    const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
    if (fs.existsSync(layoutPath)) {
      const layoutContent = fs.readFileSync(layoutPath, 'utf8');
      const markerMatch = layoutContent.match(/\/\/ DEPLOYMENT_MARKER: (.+)/);
      if (markerMatch) {
        codeMarkers.push({
          file: 'src/app/layout.tsx',
          marker: markerMatch[1]
        });
      }
    }

    // Check dashboard page for deployment marker
    const dashboardPath = path.join(process.cwd(), 'src/app/dashboard/page.tsx');
    if (fs.existsSync(dashboardPath)) {
      const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
      const markerMatch = dashboardContent.match(/\/\/ DEPLOYMENT_MARKER: (.+)/);
      if (markerMatch) {
        codeMarkers.push({
          file: 'src/app/dashboard/page.tsx',
          marker: markerMatch[1]
        });
      }
    }

    deploymentInfo.codeMarkers = codeMarkers;

    return NextResponse.json(deploymentInfo);
  } catch (error) {
    console.error('Error verifying deployment:', error);
    return NextResponse.json(
      {
        error: true,
        message: 'Failed to verify deployment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
