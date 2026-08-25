const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS_DIR = path.join(__dirname, 'assets', 'images');
const ANDROID_RES_DIR = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

const APP_STORE_IMAGE = path.join(ASSETS_DIR, 'appstore.png');
const PLAY_STORE_IMAGE = path.join(ASSETS_DIR, 'playstore.png');
const LOGO_IMAGE = path.join(ASSETS_DIR, 'logo.png'); // Typically 512x512 or larger

// 1. Function to apply 12px rounded corners mask
async function applyRoundedCorners(imagePath, targetPath, radius) {
  if (!fs.existsSync(imagePath)) {
    console.error('File not found:', imagePath);
    return;
  }
  
  try {
    const metadata = await sharp(imagePath).metadata();
    const width = metadata.width;
    const height = metadata.height;
    
    // Create SVG mask for border-radius 12px
    const roundedCorners = Buffer.from(
      `<svg><rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}"/></svg>`
    );
    
    await sharp(imagePath)
      .composite([{
        input: roundedCorners,
        blend: 'dest-in'
      }])
      .png()
      .toFile(targetPath);
      
    console.log(`Successfully applied ${radius}px border radius to:`, targetPath);
  } catch (error) {
    console.error(`Error processing ${imagePath}:`, error);
  }
}

// 2. Generate Android mipmap icons from playstore.png or logo.png
const ANDROID_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

async function generateAndroidIcons() {
  // Use playstore.png as source (ideal for square/icon shapes) or logo.png
  const sourceImage = fs.existsSync(PLAY_STORE_IMAGE) ? PLAY_STORE_IMAGE : LOGO_IMAGE;
  
  if (!fs.existsSync(sourceImage)) {
    console.error('No source icon found. Please ensure playstore.png or logo.png exist.');
    return;
  }

  for (const [folderName, size] of Object.entries(ANDROID_SIZES)) {
    const targetDir = path.join(ANDROID_RES_DIR, folderName);
    
    // Create mipmap folder if missing (usually exists)
    if (!fs.existsSync(targetDir)) {
      console.log(`Creating directory: ${targetDir}`);
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // We will generate the regular icon with no mask, because Android shapes are controlled 
    // by the OS launcher/adaptive icons setup. The user wants the logo there and no defaults.
    const iconPath = path.join(targetDir, 'ic_launcher.png');
    const roundIconPath = path.join(targetDir, 'ic_launcher_round.png');
    
    try {
      // 1. Generate standard square/fullbleed icon
      await sharp(sourceImage)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .toFile(iconPath);
        
      // 2. Generate legacy round icon manually (using fully rounded mask: 50% radius)
      const roundMask = Buffer.from(
        `<svg><circle cx="${size/2}" cy="${size/2}" r="${size/2}" /></svg>`
      );
      await sharp(sourceImage)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .composite([{ input: roundMask, blend: 'dest-in' }])
        .png()
        .toFile(roundIconPath);
        
      console.log(`Generated ${size}x${size} icons in ${folderName}`);
    } catch (e) {
      console.error(`Error generating icon for ${folderName}:`, e);
    }
  }
}

// 3. Generate iOS Icons from appstore.png
const IOS_RES_DIR = path.join(__dirname, 'ios', 'MyEdudocsApp', 'Images.xcassets', 'AppIcon.appiconset');
const IOS_SIZES = [
  { name: 'Icon-20@1x.png', size: 20 },
  { name: 'Icon-20@2x.png', size: 40 },
  { name: 'Icon-20@3x.png', size: 60 },
  { name: 'Icon-29@1x.png', size: 29 },
  { name: 'Icon-29@2x.png', size: 58 },
  { name: 'Icon-29@3x.png', size: 87 },
  { name: 'Icon-40@1x.png', size: 40 },
  { name: 'Icon-40@2x.png', size: 80 },
  { name: 'Icon-40@3x.png', size: 120 },
  { name: 'Icon-60@2x.png', size: 120 },
  { name: 'Icon-60@3x.png', size: 180 },
  { name: 'Icon-76@1x.png', size: 76 },
  { name: 'Icon-76@2x.png', size: 152 },
  { name: 'Icon-83.5@2x.png', size: 167 },
  { name: 'Icon-1024@1x.png', size: 1024 },
];

async function generateIOSIcons() {
  if (!fs.existsSync(APP_STORE_IMAGE)) {
    console.error('No source icon found for iOS. Please ensure appstore.png exists.');
    return;
  }

  if (!fs.existsSync(IOS_RES_DIR)) {
    console.error('iOS AppIcon directory not found:', IOS_RES_DIR);
    return;
  }

  for (const item of IOS_SIZES) {
    const targetPath = path.join(IOS_RES_DIR, item.name);
    try {
      await sharp(APP_STORE_IMAGE)
        .resize(item.size, item.size)
        .png()
        .toFile(targetPath);
      console.log(`Generated iOS icon: ${item.name} (${item.size}x${item.size})`);
    } catch (e) {
      console.error(`Error generating iOS icon ${item.name}:`, e);
    }
  }
}

async function run() {
  console.log("Starting Asset Generation...");
  
  // Create output directory for processed store images
  const storeExportDir = path.join(__dirname, 'assets', 'store-ready');
  if (!fs.existsSync(storeExportDir)) {
    fs.mkdirSync(storeExportDir, { recursive: true });
  }

  // 1. Apply 12px rounded corners for store icons (as requested explicitly)
  await applyRoundedCorners(APP_STORE_IMAGE, path.join(storeExportDir, 'appstore-12px.png'), 12);
  await applyRoundedCorners(PLAY_STORE_IMAGE, path.join(storeExportDir, 'playstore-12px.png'), 12);

  // 2. Override Android IC Launcher defaults
  await generateAndroidIcons();

  // 3. Override iOS AppIcons
  await generateIOSIcons();
  
  console.log("Asset Generation Complete.");
}

run();
