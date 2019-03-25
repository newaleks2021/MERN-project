const getImageSize = require('image-size');
const spawn = require('child_process').spawnSync;
const commandExists = require('command-exists').sync;
const fs = require('fs');
const path = require('path');
const docx = require('docx');
const cheerio = require('cheerio');
const uuid = require('uuid/v4');
const HtmlTableToJson = require('tabletojson');
const syncRequest = require('sync-request');
const request = require('request');
const striptags = require('striptags');

const ARROWHEAD_TO = 0;
const ARROWHEAD_FROM = 1;
const ARROWHEAD_BOTH = 2;

const docColors = {
  primary: 'e04b1a',
  secondary: '',
  text: '36474f',
};


/**
 * -----------------------------------------------------------------------------
 *
 * Local helper functions
 *
 * -----------------------------------------------------------------------------
 */

/**
 * narrativeName
 *
 * @param {string} name
 *   The narrative key to look for.
 * @return {string}
 *   The human-readable version of the narrative key.
 */
function narrativeName(name) {
  const narrativeNames = {
    progress: 'Progress',
    validationAndAssumptions: 'Validation & Assumptions',
    tradeOffs: 'Trade-offs',
    innovation: 'Innovation',
    needs: 'Needs',
    opportunitiesAndThreats: 'Opportunities & threats',

    VisionOfSuccess: 'Vision of Success',
    SituationalAnalysis: 'Situation analysis',
    PurposeAndScope: 'Purpose and Scope',
    StrategyNarrative: 'Strategy narrative',
    ChangeStory: 'Change story',
  };

  return narrativeNames[name];
}

/**
 * downloadImageToTmpDirectory
 *
 * @description
 *   Download an external image and save it in the /tmp directory.
 *
 * @param {string} url
 *   The url to the image source.
 * @return {string}
 *   The filepath to the image in the /tmp directory.
 */
function downloadImageToTmpDirectory(url) {
  const id = uuid.v4();
  const filepath = `/tmp/${id}.png`;
  const response = syncRequest('GET', url);
  fs.writeFileSync(filepath, response.getBody());
  return filepath;
}


/**
 * getVideoThumbnail
 *
 * @param {string} source
 *   The url to a video source to get the thumbnail from.
 * @return {string}
 *   The internal filepath to the downloaded video thumbnail.
 */
function getVideoThumbnail(source) {
  const patterns = {
    //  Thanks to:
    //  https://stackoverflow.com/questions/2964678/jquery-youtube-url-validation-with-regex#answer-10315969
    youtube: /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/,

    // thanks to:
    // https://stackoverflow.com/questions/13286785/get-video-id-from-vimeo-url#answer-13286930
    // eslint-disable-next-line
    vimeo: /^https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)$/,
  };

  let match;
  let domain;
  for (const key in patterns) {
    match = patterns[key].exec(source);

    if (match) {
      domain = key;
      break;
    }
  }

  if (!match) return false;
  const vid = match[1];
  switch (domain.toLowerCase()) {
    case 'youtube': {
      const url = `https://img.youtube.com/vi/${vid}/0.jpg`;
      return downloadImageToTmpDirectory(url);
    }
    case 'vimeo':{
      let vimeo_api_response = syncRequest('GET', `https://vimeo.com/api/v2/video/${vid}.json`).getBody().toString();
      let vimeo_json = JSON.parse(vimeo_api_response);
      return downloadImageToTmpDirectory(vimeo_json[0].thumbnail_large);
    }

    default: {
      return downloadImageToTmpDirectory("http://via.placeholder.com/720x480?text=Video%20error");
    }
  }
}

/**
 * -----------------------------------------------------------------------------
 * HTML parser functions
 * -----------------------------------------------------------------------------
 */

/**
 * parseElement
 *
 * @param {object} element
 *   A cheerio object containing the element to parse.
 * @param {Paragraph} paragraph
 *   A docx.Paragraph instance where we append the data to.
 * @styles {object} styles
 *   Holds the styles coming from all the parents being parsed that determines
 *   the actual output of how the text should render.
 * @return void
 */
function parseElement(element, paragraph, styles) {
  styles = styles || {
    bold: false,
    italic: false,
    strikethrough: false,
    underline: false,
    link: false,
  };

  if (element.type === 'tag') {
    switch (element.tagName) {
      case 'em': {
        if (element.children) {
          element.children.forEach((childElement) => {
            parseElement(childElement, paragraph, {
              ...styles,
              italic: true,
            });
          });
        }
        break;
      }

      case 'strong': {
        if (element.children) {
          element.children.forEach((childElement) => {
            parseElement(childElement, paragraph, {
              ...styles,
              bold: true,
            });
          });
        }
        break;
      }

      case 'u': {
        if (element.children) {
          element.children.forEach((childElement) => {
            parseElement(childElement, paragraph, {
              ...styles,
              underline: true,
            });
          });
        }
        break;
      }

      case 's': {
        if (element.children) {
          element.children.forEach((childElement) => {
            parseElement(childElement, paragraph, {
              ...styles,
              strikethrough: true,
            });
          });
        }
        break;
      }

      case 'a': {
        if (element.children) {
          element.children.forEach((childElement) => {
            parseElement(childElement, paragraph, {
              ...styles,
              underline: true,
              link: true,
            });
          });
        }
        break;
      }

      default: {
        if (element.children) {
          element.children.forEach((childElement) => {
            parseElement(childElement, paragraph, styles);
          });
        }
        break;
      }
    }
  }
  // Here we add the actual text to the paragraph.
  else if (element.type === 'text') {
    const text = element.data;
    if (text.trim()) {
      const p = new docx.TextRun(text);

      if (styles.italic) p.italic();
      if (styles.bold) p.bold();
      if (styles.underline) p.underline();
      if (styles.strikethrough) p.strike();
      if (styles.underline) p.underline();
      if (styles.link) p.color(docColors.primary);

      paragraph.addRun(p);
    }
  }
}

/**
 * parseTable
 *
 * @param {array} content
 *   The content where we will append the parsed table to.
 * @param {object} element
 *   A cheerio object containing the element to parse.
 * @param {string} html
 *   The HTML that should be parsed containing the table data.
 * @return void
 */
function parseTable(content, element, html) {
  const $ = cheerio.load(html);
  const jsonTableData = HtmlTableToJson.convert(html, {
    stripHtmlFromCells: false,
    stripHtmlFromHeadings: false,
    useFirstRowForHeadings: true,
  });
  const tableData = jsonTableData[0];

  // Grab the caption and parse it.
  if ($('table caption').length > 0) {
    const caption = $('table caption').get(0);
    const paragraph = new docx.Paragraph().style('Paragraph').center();
    parseElement(caption, paragraph);
    content.push(paragraph);
  }

  if (tableData) {
    const rowsCount = tableData.length;
    const colsCount = Object.keys(tableData[0]).length;
    const table = {
      type: 'table',
      rows: rowsCount,
      cols: colsCount,
      cells: [],
    };

    tableData.forEach((row, row_index) => {
      Object.keys(row).forEach((column, column_index) => {
        const cellHtml = row[column];
        const $ = cheerio.load(cellHtml.replace(/\t/g, "").replace(/\n/g, ""));

        const paragraph = new docx.Paragraph().style('TableCell');
        $('body').each((index, element) => {
          parseElement(element, paragraph);
        });

        table.cells.push({
          x: column_index,
          y: row_index,
          text: paragraph,
        });
      });
    });
    content.push(table);
  }
}

/**
 * parseNumberedList
 *
 * @param {array} content
 *   The content where we will append the parsed table to.
 * @param {object} element
 *   A cheerio object containing the element to parse.
 * @param {Num} numbering
 *   A docx.Num instance that is needed along with the `level` to add a proper
 *   indent for the list item being parsed.
 * @param {number} level
 *   The indent level of the list, where 0 is the first level.
 * @return void
 */
function parseNumberedList(content, element, numbering, level = 0) {
  if (element.type === 'tag') {
    switch (element.tagName) {
      case 'ol': {
        if (element.children) {
          element.children.forEach((childElement) => {
            parseNumberedList(content, childElement, numbering, level + 1);
          });
        }
        break;
      }

      default: {
        if (element.children) {
          element.children.forEach((childElement) => {
            parseNumberedList(content, childElement, numbering, level);
          });
        }
        break;
      }
    }
  }
  else if (element.type === 'text') {
    const paragraph = new docx.Paragraph(element.data)
      .setNumbering(numbering, level);
    // TODO: When there is support for formatting in Lists, uncomment next line
    // and change `new docx.Paragraph(element.data)` -> `new docx.Paragraph()`
    // parseElement(element, paragraph);
    content.push(paragraph);
  }
}

/**
 * parseBulletList
 *
 * @param {array} content
 *   The content where we will append the parsed table to.
 * @param {object} element
 *   A cheerio object containing the element to parse.
 * @param {number} level
 *   The indent level of the list, where 0 is the first level.
 * @return void
 */
function parseBulletList(content, element, level = 0) {
  if (element.type === 'tag') {
    switch (element.tagName) {
      case 'ul': {
        if (element.children) {
          element.children.forEach((childElement) => {
            parseBulletList(content, childElement, level + 1);
          });
        }
        break;
      }

      default: {
        if (element.children) {
          element.children.forEach((childElement) => {
            parseBulletList(content, childElement, level);
          });
        }
        break;
      }
    }
  }
  else if (element.type === 'text') {
    const paragraph = new docx.Paragraph()
      .style('ListParagraph')
      .bullet(level);
    // TODO: When there is support for formatting in Lists, uncomment next line
    // and change `new docx.Paragraph(element.data)` -> `new docx.Paragraph()`
    parseElement(element, paragraph);
    content.push(paragraph);
  }
}

/**
 * parseHTML
 *
 * @param {string} html
 *   The HTML contents, containing the data to parse.
 * @return {array}
 *   Returns the content being generated
 */
function parseHTML(htmlText) {
  const content = [];
  const $ = cheerio.load(htmlText.replace(/\t/g, "").replace(/\n/g, ""));
  $('body > *').map((index, element) => {
    switch (element.tagName) {
      case 'p': {
        if (!element.children) {
          break;
        }

        if (element.children[0].tagName === 'img') {
          const img = element.children[0];
          const filepath = downloadImageToTmpDirectory(img.attribs.src);
          content.push({
            type: 'inline_image',
            filePath: path.dirname(filepath),
            fileName: path.basename(filepath),
            file : filepath,
          });
        } else {
          // Since we use CKEDITOR and users are not allowed to edit the source, we
          // want to grab each p-tag and make a separate paragraph for that. This
          // makes spacing and styling much easier for us.
          const paragraph = new docx.Paragraph().style('Paragraph');
          parseElement(element, paragraph);
          content.push(paragraph);
        }
        break;
      }

      case 'table': {
        const html = $.html(element);
        parseTable(content, element, html);
        break;
      }

      case 'ol': {
        // FIXME: Only allow plain text in <li> by altering the current
        // `element`, because there is no support yet from the DOCX module for
        // formatted text with a TextRun inside lists.
        // ---------------------------------------------------------------------
        // -- REMOVE THIS BLOCK IF THERE IS SUPPORT FOR FORMATTED LIST ITEMS ---
        const html = $.html(element);
        const ch = cheerio.load(striptags(html, ['ol', 'li']));
        element = {
          children: [],
        };
        Object.values(ch('body > ol > li')).forEach((el) => {
          if (typeof el === 'object' && el.tagName === 'li') {
            element.children.push(el);
          }
        });
        // -- REMOVE THIS BLOCK IF THERE IS SUPPORT FOR FORMATTED LIST ITEMS ---
        // ---------------------------------------------------------------------

        if (element.children) {
          const numbering = new docx.Numbering();
          const abstractNum = numbering.createAbstractNumbering();
          const concreteNumbering = numbering.createConcreteNumbering(abstractNum);

          element.children.forEach((childElement) => {
            parseNumberedList(content, childElement, concreteNumbering);
          });
        }
        break;
      }

      case 'ul': {
        // FIXME: Only allow plain text in <li> by altering the current
        // `element`, because there is no support yet from the DOCX module for
        // formatted text with a TextRun inside lists.
        // ---------------------------------------------------------------------
        // -- REMOVE THIS BLOCK IF THERE IS SUPPORT FOR FORMATTED LIST ITEMS ---
        const html = $.html(element);
        const ch = cheerio.load(striptags(html, ['ul', 'li']));
        element = {
          children: [],
        };
        Object.values(ch('body > ul > li')).forEach((el) => {
          if (typeof el === 'object' && el.tagName === 'li') {
            element.children.push(el);
          }
        });
        // -- REMOVE THIS BLOCK IF THERE IS SUPPORT FOR FORMATTED LIST ITEMS ---
        // ---------------------------------------------------------------------

        if (element.children) {
          // Instead of default behavior by adding TextRun's to 1 single
          // paragraph we have to create a new paragraph for every list item.
          element.children.forEach((childElement) => {
            parseBulletList(content, childElement);
          });
        }
        break;
      }

      default: {
        // To prevent empty tags rendered, check if it has 1 or more childs.
        if (element.children) {
          const paragraph = new docx.Paragraph().style('Paragraph');
          parseElement(element, paragraph);
          content.push(paragraph);
        }
        break;
      }
    }

    return element;
  });

  return content;
}

/**
 * -----------------------------------------------------------------------------
 * Relationship functions
 * -----------------------------------------------------------------------------
 */

/**
 * getRelationshipLabel
 *
 * @param {object} relationship
 *   The relationship instance to fetch the label from.
 * @parm {object} blocks
 *   The blocks of a single project instance.
 * @return {string}
 *   Returns a relationship label pointing out the relationship of how two
 *   blocks are related to eachother. Examples:
 *   - 'Block A' --> 'Block B'
 *   - 'Block A' <--> 'Block B'
 *   - 'Block A' <-- 'Block B'
 */
function getRelationshipLabel(relationship, blocks) {
  const labelBlockA = blocks[relationship.from] ? blocks[relationship.from].title : 'Unnamed';
  const labelBlockB = blocks[relationship.to] ? blocks[relationship.to].title : 'Unnamed';
  const arrowLeft = relationship.arrowhead === ARROWHEAD_FROM || relationship.arrowhead === ARROWHEAD_BOTH ? '<' : '';
  const arrowRight = relationship.arrowhead === ARROWHEAD_TO || relationship.arrowhead === ARROWHEAD_BOTH ? '>' : '';

  return `${labelBlockA} ${arrowLeft}--${arrowRight} ${labelBlockB}`;
}

/**
 * -----------------------------------------------------------------------------
 * Content generate functions
 * -----------------------------------------------------------------------------
 */

/**
 * generateBlockContent
 *
 * @param {object} block
*   An instance of a block of the current project being exported.
 * @return {array}
 *   A list containing paragraphs of content which will be appended later on in
 *   the code to the actual document.
 */
function generateBlockContent(block) {
  const content = [];

  let blockTitle = new docx.Paragraph(block.title).heading2();
  content.push(blockTitle);

  return content;
}


/**
 * generateRelationshipContent
 *
 * @param {object} relationship
 *   An instance of a relationship of the current project being exported.
 * @param {object} blocks
 *   The blocks of a single project instance.
 * @return {array}
 *   A list containing paragraphs of content which will be appended later on in
 *   the code to the actual document.
 */
function generateRelationshipContent(relationship, blocks) {
  const content = [];

  const relationshipLabel = getRelationshipLabel(relationship, blocks);
  let relationshipHeading = new docx.Paragraph(relationshipLabel).heading2();
  content.push(relationshipHeading);

  return content;
}


/**
 * generateNarrativeContent
 *
 * @param {object} narrative
 *   An instance of a narrative of the current project being exported.
 * @param {object} options
 *   Additional options which may effect the render result.
 * @return {array}
 *   A list containing paragraphs of content which will be appended later on in
 *   the code to the actual document.
 */
async function generateNarrativeContent(narrative, options) {
  let content = [];

  if (!narrative) {
    return content;
  }

  const title = narrativeName(narrative.narrative_type);
  let narrativeHeading = new docx.Paragraph(title).heading3();
  if (options.pageBreakTitle) {
    narrativeHeading = narrativeHeading.pageBreakBefore();
  }
  content.push(narrativeHeading);

  if (narrative.pages) {
    await Promise.all(Object.values(narrative.pages).map(async (page) => {

      const pageLabel = new docx.Paragraph(page.label).heading4();
      content.push(pageLabel);

      if (page.paragraphs) {
        await Promise.all(page.paragraphs.map(async (paragraph) => {
          switch (paragraph.type) {
            case 'image': {
              const filepath = path.join(__dirname, '../public/uploads', paragraph.content.file_name);
              content.push({
                type: 'narrative_paragraph_image',
                filePath: path.dirname(filepath),
                fileName: path.basename(filepath),
                file : filepath,
              });
              break;
            }

            case 'video': {
              const filepath = getVideoThumbnail(paragraph.content);
              content.push({
                type: 'narrative_paragraph_video',
                filePath: path.dirname(filepath),
                fileName: path.basename(filepath),
                file : filepath,
                uri: paragraph.content,
              });
              break;
            }

            case 'title': {
              const p = new docx.Paragraph().heading5();
              const pageParagraph = new docx.TextRun(paragraph.content);
              p.addRun(pageParagraph);
              content.push(p);
              break;
            }

            case 'text': {
              const parsedContent = parseHTML(paragraph.content);
              content = [
                ...content,
                ...parsedContent,
              ];
              break;
            }

            default: {
              const p = new docx.Paragraph().style('Paragraph');
              const pageParagraph = new docx.TextRun(paragraph.content).break();
              p.addRun(pageParagraph);
              content.push(p);
              break;
            }
          }

          return paragraph;
        }));
      }
      return page;
    }));
  }

  return content;
}

/**
 * -----------------------------------------------------------------------------
 * DOCX Document functions
 * -----------------------------------------------------------------------------
 */
function setDocStyles(doc) {
  const styles = new docx.Styles();

  /**
   * Spacing value explanation:
   *
   * .size(40)
   *    -> 40 half-points == 20pt font
   *
   * .spacing({ before: 300, after: 300 })
   *    -> 15 TWIP == 1 pixel
   *    -> 300 TWIP == 20 pixel
   */

  // Spacing is converted from TWIP.
  const spacing = (v) => v * 15;

  // Line is measured in 240ths of a line.
  const lineHeight = (v) => v * 240;

  // Fonts are measured in half-points.
  const fontSize = (v) => v * 2;

  // Add some global custom helper functions to calculate spacing / line-height.
  doc.styles.spacing = spacing;
  doc.styles.lineHeight = lineHeight;
  doc.styles.fontSize = fontSize;

  // Default
  doc.styles.createParagraphStyle('DefaultStyle', 'Default Style')
    .font('Verdana')
    .size(fontSize(12))
    .color(docColors.text);

  // Paragraphs
  doc.Styles.createParagraphStyle('Paragraph', 'Paragraph')
    .basedOn('DefaultStyle')
    .spacing({ before: spacing(10), after: spacing(10), line: lineHeight(1.2) });

  // Lists
  doc.Styles.createParagraphStyle('ListParagraph', 'List Paragraph')
    .basedOn('Paragraph')
    .spacing({ before: spacing(5), after: spacing(5), line: lineHeight(1.2) });

  // Headings
  doc.styles.createParagraphStyle('HeadingBase', 'Heading base style')
    .basedOn('DefaultStyle')
    .bold();

  doc.styles.createParagraphStyle('Heading1', 'Heading 1')
    .basedOn('HeadingBase')
    .size(fontSize(20))
    .spacing({ after: spacing(20) });

  doc.Styles.createParagraphStyle('Heading2', 'Heading 2')
    .basedOn('HeadingBase')
    .size(fontSize(16))
    .spacing({ after: spacing(18) });

  doc.Styles.createParagraphStyle('Heading3', 'Heading 3')
    .basedOn('HeadingBase')
    .size(fontSize(14))
    .spacing({ after: spacing(16) });

  doc.Styles.createParagraphStyle('Heading4', 'Heading 4')
    .basedOn('HeadingBase')
    .size(fontSize(12))
    .spacing({ after: spacing(15) });

  doc.Styles.createParagraphStyle('Heading5', 'Heading 5')
    .basedOn('HeadingBase')
    .size(fontSize(10))
    .spacing({ after: spacing(15) });

  // Tables
  doc.Styles.createParagraphStyle('TableCell', 'Table cell')
    .basedOn('DefaultStyle')
    .spacing({ before: spacing(10), after: spacing(10), line: lineHeight(1) });
}

/**
 * createResponsiveImage
 *
 * @description
 *   A wrapper function for the `docx.createImage()` function where we pass in
 *   the correct width/height params and prevent it from overlapping the
 *   document.
 *
 * @param {Document} doc
 *   The scope of the document where the createImage function is being called
 *   on. This can be the global document, header or footer scope.
 * @param {string} imagePath
 * @param {('body', 'header', 'footer')} scope
 *   The scope of where the image is being rendered.
 * @param {string} text
 *   Additional text being rendered below the image.
 * @return void
 */
function createResponsiveImage(doc, imagePath, scope, text = '') {
  const docWidth = 600;
  const dimensions = getImageSize(imagePath);
  const width = parseInt(dimensions.width);
  const height = parseInt(dimensions.height);

  // Do a scale-to-fit calculation when the image is overlapping.
  const scale = width / docWidth;
  if (scale > 1) {
    doc.createImage(fs.readFileSync(imagePath), (width / scale), (height / scale));
  } else {
    doc.createImage(fs.readFileSync(imagePath), width, height);
  }

  if (scope === 'body') {
    const dummyParagraph = new docx.Paragraph(text).spacing({
      before: text !== '' && doc.styles.spacing(4),
      after: doc.styles.spacing(10),
    });
    doc.addParagraph(dummyParagraph);
  }
}

/**
 * -----------------------------------------------------------------------------
 *
 * Export functions
 *
 * -----------------------------------------------------------------------------
 */

/**
 * createDOCX
 *
 * @description
 *   Create a .docx word-document.
 *
 * @param {string} format
 *   The DOCX version the user specified.
 *   Can be one of the following types:
 *     - docx (which is Word 2008+ support)
 *     - docx-2007 which is support for Word 2007 and lower
 *     - PDF
 * @param {object} project
 *   The whole project data tree.
 * @param {string} svg
 *   A base64 string containing the whole svg element.
 * @param {boolean} include_narratives
 *   True or false wether to include narratives.
 * @param {boolean} include_content_pages
 *   True or false wether to include content_pages
 * @return {Document}
 *   An instance of a docx document.
 */
const createDOCX = async (format, project, svg, include_narratives, include_content_pages) => {
  const doc = new docx.Document({
    creator: 'Changeroo',
    description: `Project ${project.name} export`,
    title: project.name || 'Untitled',
  });

  // Add a custom wrapper functions to add an image to the document properly.
  doc.createResponsiveImage = (imagePath, text) => createResponsiveImage(doc, imagePath, 'body', text);
  doc.Header.createResponsiveImage = (imagePath) => createResponsiveImage(doc.Header, imagePath, 'header');
  doc.Footer.createResponsiveImage = (imagePath) => createResponsiveImage(doc.Footer, imagePath, 'content');

  // Apply our custom Changeroo style like font-size, line-height, margins etc.
  setDocStyles(doc);

  // An array containg all the paragraphs.
  let content = [];

  // Create the cover.
  const coverTitle = new docx.Paragraph(project.name || 'Untitled').title().center().pageBreak();
  content.push(coverTitle);

  // Add a table of contents.
  content.push({
    type: 'table_of_contents',
    tableOfContents: new docx.TableOfContents("Table of Contents", {
      hyperlink: true,
      headingStyleRange: "1-5",
    }),
  });

  // Create the header.
  if (format === 'docx-2007') {
    const docHeader = doc.Header.createParagraph();
    docHeader.addRun(new docx.TextRun('Changeroo'));
  } else {
    doc.Header.createResponsiveImage(path.join(__dirname, '../public/img/logo-small.png'));
  }

  // Create the footer.
  const footerParagraphRight = new docx.Paragraph().right();
  const pageNumber = new docx.TextRun("Page ").pageNumber();
  footerParagraphRight.addRun(pageNumber);
  doc.Footer.addParagraph(footerParagraphRight);

  // If the SVG is available, write it to a temp file and append it to the doc.
  if (svg && format !== 'docx-2007') {
    const id = uuid.v4();
    const filepath = `/tmp/${id}.svg`;
    const svgData = svg.replace(/^data:image\/.*base64,/, "");
    const svgBuffer = new Buffer(svgData, 'base64');

    fs.writeFileSync(filepath, svgBuffer);

    // Use puppeteer to open the svg in a browser and take a screenshot.
    // Use headless mode of Chromium to:
    // - open the svg in a browser
    // - take a screenshot of the page
    // - write the file under a specified filename
    if (commandExists('google-chrome')) {
      const $ = cheerio.load(svgBuffer);
      const width = $('svg').attr('width');
      const height = $('svg').attr('height');
      const newFilePath = filepath.replace(/\.svg$/, '.png');
      spawn('google-chrome', [
        '--headless',
        '--disable-gpu',
        `--screenshot=${newFilePath}`,
        `--window-size=${width},${height}`,
        '--no-sandbox',
        '--hide-scrollbars',
        `file://${filepath}`,
      ]);

      content.push({
        type: 'image',
        filePath: path.dirname(newFilePath),
        fileName: `${id}.png`,
        file: newFilePath,
      });
    } else {
      console.log('[error] Unknown command: google-chrome.');
    }

    fs.unlink(filepath);
  }

  // Strategy narratives
  if (include_narratives) {
    const toc_narratives = project.data.toc_narratives || {};
    const toc_narrative_keys = [
      'VisionOfSuccess',
      'ChangeStory',
      'SituationalAnalysis',
      'PurposeAndScope',
    ];

    let hasStrategyNarratives = Object.keys(toc_narratives).length > 0;
    if (hasStrategyNarratives) {
      content.push(new docx.Paragraph('Strategy narratives').heading1().pageBreakBefore());
    }

    await Promise.all(toc_narrative_keys.map(async (narrative_key, toc_narrative_index) => {
      const uuid = toc_narratives[narrative_key];
      const narrative = project.data.narratives[uuid];

      const narrativeContent = await generateNarrativeContent(narrative, {
        pageBreakTitle: toc_narrative_index > 0,
      });
      content = [
        ...content,
        ...narrativeContent,
      ];
      return narrative_key;
    }));
  }

  // Block narratives
  if (include_content_pages) {
    if (project.data.blocks) {
      let hasBlockContent = Object.values(project.data.blocks).length > 0;

      if (hasBlockContent) {
        content.push(new docx.Paragraph('Blocks').heading1().pageBreakBefore());
      }

      await Promise.all(Object.values(project.data.blocks).map(async (block, block_index) => {
        const blockContent = generateBlockContent(block);
        content = [
          ...content,
          ...blockContent,
        ];

        if (block.narratives) {
          await Promise.all(Object.values(block.narratives).map(async (uuid, block_narrative_index) => {
            const narrative = project.data.narratives[uuid];
            const narrativeContent = await generateNarrativeContent(narrative, {
              pageBreakTitle: block_narrative_index > 0,
            });
            content = [
              ...content,
              ...narrativeContent,
            ];
            return uuid;
          }));
        }
        return block;
      }));
    }

    // Relationship narratives
    if (project.data.relationships) {
      let hasRelationshipContent = Object.values(project.data.blocks).length > 0;

      if (hasRelationshipContent) {
        content.push(new docx.Paragraph('Relationships').heading1().pageBreakBefore());
      }

      await Promise.all(Object.values(project.data.relationships).map(async (relationship, relationship_index) => {
        const relationshipContent = generateRelationshipContent(relationship, project.data.blocks);
        content = [
          ...content,
          ...relationshipContent,
        ];

        if (relationship.narratives) {
          await Promise.all(Object.values(relationship.narratives).map(async (uuid, relationship_narrative_index) => {
            const narrative = project.data.narratives[uuid];
            const narrativeContent = await generateNarrativeContent(narrative, {
              pageBreakTitle: relationship_narrative_index > 0,
            });
            content = [
              ...content,
              ...narrativeContent,
            ];
            return uuid;
          }));
        }
        return relationship;
      }));
    }
  }

  content.forEach((paragraph) => {
    switch (paragraph.type) {
      case 'inline_image':
      case 'image': {
        if (fs.existsSync(paragraph.file) && format !== 'docx-2007') {
          doc.createResponsiveImage(paragraph.file);
          fs.unlink(paragraph.file);
        }
        break;
      }
      case 'narrative_paragraph_image': {
        if (fs.existsSync(paragraph.file) && format !== 'docx-2007') {
          doc.createResponsiveImage(paragraph.file);
        }
        break;
      }
      case 'narrative_paragraph_video': {
        if (fs.existsSync(paragraph.file) && format !== 'docx-2007') {
          doc.createResponsiveImage(paragraph.file, `Video: ${paragraph.uri}`);
          fs.unlink(paragraph.file);
        }
        break;
      }
      case 'table_of_contents': {
        doc.addTableOfContents(paragraph.tableOfContents);
        break;
      }
      case 'table': {
        const table = doc.createTable(paragraph.rows, paragraph.cols);
        paragraph.cells.forEach((cell) => {
          table.getCell(cell.y, cell.x).addContent(cell.text);
        });
        break;
      }
      default: {
        doc.addParagraph(paragraph);
        break;
      }
    }
  });

  return doc;
};

module.exports = {
  createDOCX,
};
