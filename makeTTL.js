const fs = require('fs');
const N3 = require('n3');
const parse = require('csv-parse/lib/sync');

const writer = N3.Writer({ prefixes: {
  ak:'http://base.uni-ak.ac.at/recherche/keywords/',
  grddl:'http://www.w3.org/2003/g/data-view#',
  wgs: 'http://www.w3.org/2003/01/geo/wgs84_pos#',
  owl: 'http://www.w3.org/2002/07/owl#',
  gn: 'http://www.geonames.org/ontology#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  fn: 'http://www.w3.org/2005/xpath-functions#',
  skos: 'http://www.w3.org/2004/02/skos/core#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  dct: 'http://purl.org/dc/terms/',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  sesame: 'http://www.openrdf.org/schema/sesame#',
  luc: 'http://www.ontotext.com/owlim/lucene#',
  dc: 'http://purl.org/dc/elements/1.1/',
  c: 'http://example.org/cartoons#'
}});


const input = fs.readFileSync('test10.ttl', 'utf8');
const ofos = parse(fs.readFileSync('ÖFOS.csv', 'utf8'), {columns: true, delimiter: ";"});
const job = JSON.parse(fs.readFileSync('sculpture.json', 'utf8'));
const parser = N3.Parser();
const store = N3.Store();

ofos_mapped = ofos.map((rec)=> {
  return {
    id: rec.KeyName_de.split(' ')[0],
    de: rec.KeyName_de.substring(rec.KeyName_de.indexOf(' ')+1),
    en: rec.KeyName_en.substring(rec.KeyName_de.indexOf(' ')+1),
    p: rec.AbsolutePath.split('/').slice(-1)[0].split(' ')[0]
  }
});

parser.parse(input, (error, quad) => {
  if (quad) {
    store.addQuad(quad);
  } else if (error) {
    console.log(error);
  } else {
    console.log('done parsing');
    const scheme = store.getQuads(null, null, 'http://www.w3.org/2004/02/skos/core#ConceptScheme', null)[0]['subject']['id'];
    let idx = ofos_mapped.length - 1;
    while(idx + 1) {
      let top = store.getQuads(null, null, '"Discipline"@en', null)[0]['subject']['id'];
      if(ofos_mapped[idx].p != '') top = `http://base.uni-ak.ac.at/portfolio/cv/c_${ofos_mapped[idx].p}`;
      store.addQuad( `http://base.uni-ak.ac.at/portfolio/cv/c_${ofos_mapped[idx].id}`, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type','http://www.w3.org/2004/02/skos/core#Concept','');
      store.addQuad( `http://base.uni-ak.ac.at/portfolio/cv/c_${ofos_mapped[idx].id}`, 'http://www.w3.org/2004/02/skos/core#inScheme', scheme ,'');
      store.addQuad( `http://base.uni-ak.ac.at/portfolio/cv/c_${ofos_mapped[idx].id}`, 'http://www.w3.org/2004/02/skos/core#broader', top ,'');
      store.addQuad( `http://base.uni-ak.ac.at/portfolio/cv/c_${ofos_mapped[idx].id}`, 'http://www.w3.org/2004/02/skos/core#prefLabel',`"${ofos_mapped[idx].en}"@en`,'');
      store.addQuad( `http://base.uni-ak.ac.at/portfolio/cv/c_${ofos_mapped[idx].id}`, 'http://www.w3.org/2004/02/skos/core#prefLabel',`"${ofos_mapped[idx].de}"@de`,'');
      idx -= 1;
    }
    writer.addQuads(store.getQuads());
    writer.end((error, result) => {
        fs.writeFile("test11.ttl", result);
    });
  }
});

// import for sheets data
// parser.parse(input, (error, quad) => {
//   if (quad) {
//     store.addQuad(quad);
//   } else if (error) {
//     console.log(error);
//   } else {
//     console.log('done parsing');
//     const scheme = store.getQuads(null, null, 'http://www.w3.org/2004/02/skos/core#ConceptScheme', null)[0]['subject']['id'];
//     const top = store.getQuads(null, null, '"Discipline"@en', null)[0]['subject']['id'];
//     let idx = job.length - 1;
//     while(idx + 1) {
//       store.addQuad( `http://base.uni-ak.ac.at/portfolio/cv/c_${job[idx].de.replace(' ', '_')}`, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type','http://www.w3.org/2004/02/skos/core#Concept','');
//       store.addQuad( `http://base.uni-ak.ac.at/portfolio/cv/c_${job[idx].de.replace(' ', '_')}`, 'http://www.w3.org/2004/02/skos/core#inScheme', scheme ,'');
//       store.addQuad( `http://base.uni-ak.ac.at/portfolio/cv/c_${job[idx].de.replace(' ', '_')}`, 'http://www.w3.org/2004/02/skos/core#broader', top ,'');
//       if(job[idx].en) store.addQuad( `http://base.uni-ak.ac.at/portfolio/cv/c_${job[idx].de.replace(' ', '_')}`, 'http://www.w3.org/2004/02/skos/core#prefLabel',`"${job[idx].en}"@en`,'');
//       if(job[idx].de) store.addQuad( `http://base.uni-ak.ac.at/portfolio/cv/c_${job[idx].de.replace(' ', '_')}`, 'http://www.w3.org/2004/02/skos/core#prefLabel',`"${job[idx].de}"@de`,'');
//       if(job[idx].gettyAat) store.addQuad( `http://base.uni-ak.ac.at/portfolio/cv/c_${job[idx].de.replace(' ', '_')}`, 'http://www.w3.org/2004/02/skos/core#exactMatch',`${job[idx].gettyAat}`,'');
//       if(job[idx].gnd) store.addQuad( `http://base.uni-ak.ac.at/portfolio/cv/c_${job[idx].de.replace(' ', '_')}`, 'http://www.w3.org/2004/02/skos/core#exactMatch',`${job[idx].gnd}`,'');
//       idx -= 1;
//     }
//     writer.addQuads(store.getQuads());
//     writer.end((error, result) => {
//         fs.writeFile("test11.ttl", result);
//     });
//   }
// });
