// Remotion render settings for The Payer's demo video. See docs/video-run-of-show.md.
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
