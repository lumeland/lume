use wasm_bindgen::prelude::*;
use core::parse as parse_rs;
use core::parse_frag as parse_frag_rs;

#[wasm_bindgen]
pub fn parse(html: &str) -> String {
    parse_rs(html.into())
}

#[wasm_bindgen]
pub fn parse_frag(html: &str, context_local_name: &str) -> String {
    parse_frag_rs(html.into(), context_local_name.into())
}

