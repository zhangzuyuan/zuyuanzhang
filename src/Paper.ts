import { Author, Paper } from "./Types";

const nonBibtexFields = [
  "type",
  "id",
  "pdf",
  "site",
  "preprint",
  "code",
  "slides",
  "video",
  "poster",
  "project",
  "status",
  "selected",
  "tags",
  "summary",
  "abstract",
  "image",
  "award",
  "venueShort",
];


function paperToBibtex(paper: Paper) {
  return Object.entries(paper).map((item) => {
    if (item[0] === "author") {
      const authors = item[1] as Author[];
      const author = authors
        .map((a) => `${a.family}, ${a.given}`)
        .join(" and ");
      return `  author={${author}}`;
    }

    if (item[1] && !nonBibtexFields.includes(item[0])) {
      return `  ${item[0]}={${item[1]}}`;
    }

    return null;
  });
}

function getVenue(item: Paper) {
  switch (item.type) {
    case "journal":
      return item.journal;
    case "conference":
      return item.booktitle;
    case "thesis":
      return item.school;
    case "book":
      return item.publisher;
    default:
      return "";
  }
}

function getVenueShort(item: Paper) {
  if (item.venueShort) {
    return item.venueShort;
  }
  return getVenue(item);
}

function getTypeLabel(item: Paper) {
  switch (item.type) {
    case "journal":
      return "Journal";
    case "conference":
      return "Conference";
    case "thesis":
      return "Thesis";
    case "book":
      return "Book";
    default:
      return "Publication";
  }
}

function generateBibtex(paper: Paper) {
  switch (paper.type) {
    case "journal":
      return `@ARTICLE{${paper.id},\n${paperToBibtex(paper)
        .filter((item) => item != null)
        .join(",\n")}\n}`;
    case "conference":
      return `@INPROCEEDINGS{${paper.id},\n${paperToBibtex(paper)
        .filter((item) => item != null)
        .join(",\n")}\n}`;
    case "thesis":
      return `@PHDTHESIS{${paper.id},\n${paperToBibtex(paper)
        .filter((item) => item != null)
        .join(",\n")}\n}`;
    case "book":
      return `@BOOK{${paper.id},\n${paperToBibtex(paper)
        .filter((item) => item != null)
        .join(",\n")}\n}`;
    default:
      return "";
  }
}

export { getVenue, getVenueShort, getTypeLabel, generateBibtex };


// import { Paper, Author } from "./Types";

// const nonBibtexFields = ["type", "id", "pdf", "site"];
// function paperToBibtex(paper: Paper) {
//   return Object.entries(paper).map((item) => {
//     if (item[0] === "author") {
//       const authors = item[1] as Author[];
//       const author = authors
//         .map((a) => {
//           return `${a.family}, ${a.given}`;
//         })
//         .join(" and ");
//       return `  author={${author}}`;
//     } else {
//       if (item[1]) {
//         if (!nonBibtexFields.includes(item[0])) {
//           return `  ${item[0]}={${item[1]}}`;
//         }
//       }
//     }
//     return null;
//   });
// }

// function getVenue(item: Paper) {
//   switch (item.type) {
//     case "journal":
//       return item.journal;
//     case "conference":
//       return item.booktitle;
//     case "thesis":
//       return item.school;
//     case "book":
//       return item.publisher;
//   }
// }

// function getColor(item: Paper) {
//   switch (item.type) {
//     case "journal":
//       return "danger";
//     case "conference":
//       return "primary";
//     case "thesis":
//       return "warning";
//     case "book":
//       return "warning";
//   }
// }

// function getAuthors(item: Paper) {
//   const authors: string[] = item.author.map((author) => {
//     return `${author.given} ${author.family}`;
//   });
//   authors[authors.length - 1] = `and ${authors[authors.length - 1]}`;
//   return authors.length === 2 ? authors.join(" ") : authors.join(", ");
// }

// function generateBibtex(paper: Paper) {
//   switch (paper.type) {
//     case "journal":
//       return `@ARTICLE{${paper.id},
// ${paperToBibtex(paper)
//   .filter((item) => item != null)
//   .join(",\n")}
// }`;
//     case "conference":
//       return `@INPROCEEDINGS{${paper.id},
// ${paperToBibtex(paper)
//   .filter((item) => item != null)
//   .join(",\n")}
// }`;
//     case "thesis":
//       return "";
//     case "book":
//       return "";
//   }
// }

// export { getVenue, getColor, generateBibtex, getAuthors };
