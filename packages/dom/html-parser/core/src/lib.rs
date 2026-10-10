mod rcdom;

use crate::rcdom::Node;
use crate::rcdom::NodeData;
pub use crate::rcdom::RcDom;
use html5ever::driver::parse_document;
use html5ever::driver::parse_fragment;
use html5ever::driver::ParseOpts;
use html5ever::tree_builder::TreeBuilderOpts;
use html5ever::tendril::stream::TendrilSink;
use html5ever::{namespace_url, ns};
use markup5ever::Attribute;
use markup5ever::{LocalName, QualName};
use std::cell::RefCell;
use std::io::Write;
use std::rc::Rc;

pub fn pre_parse(html: String) -> RcDom {
    let sink: RcDom = Default::default();
    let parser = parse_document(sink, Default::default());

    parser.one(html)
}

pub fn parse(html: String) -> String {
    let len = html.len();
    let sink: RcDom = Default::default();
    let parser = parse_document(sink, ParseOpts {
        tokenizer: Default::default(),
        tree_builder: TreeBuilderOpts {
            scripting_enabled: false,
            ..Default::default()
        },
    });

    let dom = parser.one(html);
    dom_to_string(len, &dom)
}

pub fn parse_frag(html: String, context_local_name: String) -> String {
    let len = html.len();
    let sink: RcDom = Default::default();
    let parser = parse_fragment(
        sink,
        Default::default(),
        QualName::new(
            None,
            ns!(html),
            LocalName::from(context_local_name),
        ),
        vec![],
    );

    let dom = parser.one(html);
    dom_to_string(len, &dom)
}

fn dom_to_string(input_len: usize, dom: &RcDom) -> String {
    let mut buf = Vec::with_capacity(input_len + input_len / 3);
    serialize_node(&mut buf, &dom.document);
    String::from_utf8(buf).expect("serialize_node failed to produce valid UTF-8")
}

enum NodeType {
    Element,
    Text,
    Irrelevant,
}

fn serialize_node(buf: &mut Vec<u8>, dom: &Rc<Node>) {
    match dom.data {
        NodeData::Document => {
            let children = dom.children.borrow();

            write!(&mut *buf, "[9,\"#document\",[]").unwrap();
            if children.len() > 0 {
                write!(&mut *buf, ",").unwrap();
                let mut last_child_rendered = false;

                for child in children.iter() {
                    if last_child_rendered {
                        // assume something will be written
                        buf.push(b',');
                    }

                    let child_rendered = {
                        let len_before = buf.len();
                        serialize_node(&mut *buf, child);
                        let len_after = buf.len();

                        len_after - len_before > 0
                    };

                    last_child_rendered = child_rendered;
                }

                if !last_child_rendered {
                    // remove comma that was written if it turns out that
                    // nothing was written by the last child
                    // (or at least, nothing was written since the last comma)
                    buf.pop().unwrap();
                }
            }
            buf.push(b']');
        }

        NodeData::Element {
            ref name,
            ref attrs,
            ref template_contents,
            ..
        } => {
            write!(&mut *buf, "[1,").unwrap();
            serde_json::to_writer(&mut *buf, &name.local).unwrap();
            write!(&mut *buf, ",").unwrap();
            serialize_element_attributes(buf, attrs);

            if let Some(contents) = template_contents {
                buf.push(b',');
                // Include <template> contents
                serialize_node(&mut *buf, &contents);
            } else {
                let children = dom.children.borrow();

                let mut last_child_rendered = true;
                for child in children.iter() {
                    if last_child_rendered {
                        // assume something will be written
                        buf.push(b',');
                    }

                    let child_rendered = {
                        let len_before = buf.len();
                        serialize_node(&mut *buf, child);
                        let len_after = buf.len();

                        len_after - len_before > 0
                    };

                    last_child_rendered = child_rendered;
                }

                if !last_child_rendered {
                    // remove comma that was written if it turns out that
                    // nothing was written by the last child
                    // (or at least, nothing was written since the last comma)
                    buf.pop().unwrap();
                }
            }

            write!(&mut *buf, "]").unwrap();
        }

        NodeData::Text { ref contents } => {
            write!(&mut *buf, "[3,").unwrap();
            serde_json::to_writer(&mut *buf, contents.borrow().as_ref()).unwrap();
            write!(&mut *buf, "]").unwrap();
        }

        NodeData::Comment { ref contents } => {
            write!(&mut *buf, "[8,").unwrap();
            serde_json::to_writer(&mut *buf, contents.as_ref()).unwrap();
            write!(&mut *buf, "]").unwrap();
        }

        NodeData::Doctype {
            ref name,
            ref public_id,
            ref system_id,
        } => {
            write!(&mut *buf, "[10,").unwrap();
            serde_json::to_writer(&mut *buf, name.as_ref()).unwrap();
            write!(&mut *buf, ",").unwrap();
            serde_json::to_writer(&mut *buf, public_id.as_ref()).unwrap();
            write!(&mut *buf, ",").unwrap();
            serde_json::to_writer(&mut *buf, system_id.as_ref()).unwrap();
            write!(&mut *buf, "]").unwrap();
        }

        _ => {}
    }
}

fn serialize_element_attributes(buf: &mut Vec<u8>, data: &RefCell<Vec<Attribute>>) {
    write!(&mut *buf, "[").unwrap();
    let vec = data.borrow();
    let vec_count = vec.len();

    for (idx, attr) in vec.iter().enumerate() {
        write!(&mut *buf, "[").unwrap();
        serde_json::to_writer(&mut *buf, attr.name.local.as_ref()).unwrap();
        write!(&mut *buf, ",").unwrap();
        serde_json::to_writer(&mut *buf, attr.value.as_ref()).unwrap();

        if idx + 1 < vec_count {
            write!(&mut *buf, "],").unwrap();
        } else {
            write!(&mut *buf, "]").unwrap();
        }
    }

    write!(&mut *buf, "]").unwrap();
}
