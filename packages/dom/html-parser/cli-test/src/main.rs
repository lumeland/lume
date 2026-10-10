use std::io::{self, Read};
use core::{parse, parse_frag};
use std::env::args;

enum Method {
    Document,
    Fragment,
}

fn main() {
    let mut method = Method::Document;
    let mut context_local_name = "div".to_string();

    for arg in args() {
        if let Method::Document = method {
            match arg.as_str() {
                "fragment" => {
                    method = Method::Fragment;
                },
                _ => {},
            }
        } else {
            context_local_name = arg;
        }
    }

    let mut buf = String::new();
    io::stdin().read_to_string(&mut buf).unwrap();

    if let Method::Document = method {
        println!("{}", parse(buf));
    } else {
        println!("{}", parse_frag(buf, context_local_name));
    }
}

