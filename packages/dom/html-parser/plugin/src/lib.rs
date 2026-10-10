use core::parse;
use core::parse_frag;

#[no_mangle]
pub extern "C" fn deno_dom_usize_len() -> usize {
    std::mem::size_of::<usize>()
}

#[no_mangle]
pub extern "C" fn deno_dom_is_big_endian() -> u32 {
    if cfg!(target_endian = "big") {
        1
    } else {
        0
    }
}

#[no_mangle]
pub extern "C" fn deno_dom_parse_sync(src_buf: *mut u8, src_len: usize, dest_buf_size_ptr: *mut usize) {
    let src_html = unsafe {
        String::from_raw_parts(src_buf, src_len, src_len)
    };
    let dest_buf_meta = unsafe {
        std::slice::from_raw_parts_mut(
            dest_buf_size_ptr,
            std::mem::size_of::<usize>() * 2,
        )
    };

    let parsed = Box::new(parse(src_html.clone()));
    dest_buf_meta[0] = parsed.len();
    dest_buf_meta[1] = Box::into_raw(parsed) as usize;

    std::mem::forget(src_html);
    std::mem::forget(dest_buf_meta);
}

#[no_mangle]
pub extern "C" fn deno_dom_parse_frag_sync(
    src_buf: *mut u8,
    src_len: usize,
    context_local_name_buf: *mut u8,
    context_local_name_len: usize,
    dest_buf_size_ptr: *mut usize
) {
    let src_html = unsafe {
        String::from_raw_parts(src_buf, src_len, src_len)
    };
    let context_local_name = unsafe {
        String::from_raw_parts(context_local_name_buf, context_local_name_len, context_local_name_len)
    };
    let dest_buf_meta = unsafe {
        std::slice::from_raw_parts_mut(
            dest_buf_size_ptr,
            std::mem::size_of::<usize>() * 2,
        )
    };

    let parsed = Box::new(parse_frag(src_html.clone(), context_local_name.clone()));
    dest_buf_meta[0] = parsed.len();
    dest_buf_meta[1] = Box::into_raw(parsed) as usize;

    std::mem::forget(src_html);
    std::mem::forget(context_local_name);
    std::mem::forget(dest_buf_meta);
}

#[no_mangle]
pub extern "C" fn deno_dom_copy_buf(src_buf_ptr_bytes: *const u8, _dest_buf_ptr: *mut u8) {
    let src_buf_ptr_bytes_owned = unsafe { (*(src_buf_ptr_bytes as *const [u8; 8])).clone() };
    let src_buf_ptr = if cfg!(target_endian = "big") {
        usize::from_be_bytes(src_buf_ptr_bytes_owned)
    } else {
        usize::from_le_bytes(src_buf_ptr_bytes_owned)
    };

    let src_string = unsafe { Box::from_raw(src_buf_ptr as *mut String) };
    let dest_slice = unsafe { std::slice::from_raw_parts_mut(_dest_buf_ptr, src_string.len()) };
    dest_slice.copy_from_slice(src_string.as_bytes());
}
