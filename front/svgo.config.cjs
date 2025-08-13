module.exports = {
  multipass: true,
  plugins: [
    'removeDoctype',
    'removeXMLProcInst',
    'removeComments',
    'removeMetadata',
    'removeEditorsNSData',
    'cleanupAttrs',
    'minifyStyles',
    'convertStyleToAttrs',
    'cleanupIDs',
    'removeRasterImages',
    'removeUselessDefs',
    'cleanupNumericValues',
    'collapseGroups',
    'convertShapeToPath',
    'sortAttrs',
    'removeDimensions',
  ],
};


