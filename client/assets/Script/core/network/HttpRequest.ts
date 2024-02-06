import {error, warn} from "cc";

// 当前请求地址集合
let urls: any = {};

// 请求事件
export enum HttpEvent {
    // 断网
    NO_NETWORK = "http_request_no_network",
    // 未知错误
    UNKNOWN_ERROR = "http_request_unknown_error",
    // 请求超时
    TIMEOUT = "http_request_timout"
}

// HTTP请求
export class HttpRequest {
    // 服务器地址
    server: string = "http://127.0.0.1/";
    // 请求超时时间
    timeout: number = 10000;

    /**
     * 取消请求中的请求
     **/
    abort(name: string) {
        const xhr = urls[this.server + name];
        if (xhr) {
            xhr.abort();
        }
    }

    callback(xhr: XMLHttpRequest,
             url: string,
             data: any,
             completeCallback?: Function,
             errorCallback?: Function,
             timeout: number = this.timeout) {
        // 回调
        xhr.timeout = timeout;
        xhr.ontimeout = () => {
            console.log(`${url} timeout`);
            this.deleteCache(url);
            data.event = HttpEvent.TIMEOUT; // 超时
            if (errorCallback) errorCallback(data);
        }

        xhr.onloadend = (a) => {
            this.deleteCache(url);
            if (xhr.status == 500) {
                if (errorCallback == null) return;
                data.event = HttpEvent.NO_NETWORK;          // 断网
                if (errorCallback) errorCallback(data);
            }
        }

        xhr.onerror = () => {
            console.log(`${url} onerror readyState:${xhr.readyState} status:${xhr.status} ${xhr.response}`);
            this.deleteCache(url);
            if (errorCallback == null) return;
            if (xhr.readyState == 0 || xhr.readyState == 1 || xhr.status == 0) {
                data.event = HttpEvent.NO_NETWORK;          // 断网
            } else {
                data.event = HttpEvent.UNKNOWN_ERROR;       // 未知错误
            }
            if (errorCallback) errorCallback(data);
        }

        xhr.onreadystatechange = () => {
            console.log(`${url} onreadystatechange readyState:${xhr.readyState} status:${xhr.status} ${xhr.response}`);
            this.deleteCache(url);
            if (xhr.readyState != 4) return;
            if (xhr.status == 200) {
                const responseBuffer = new Uint8Array(xhr.response);
                if (completeCallback) {
                    completeCallback(responseBuffer);
                }
            }
        }
    }

    /**
     * Http请求
     * @param name(string)              请求地址
     * @param callback(function)        请求成功回调
     * @param errorCallback(function)   请求失败回调
     */
    public postProtoBufParam(name: string,
                             buff: any,
                             completeCallback?: Function,
                             errorCallback?: Function,
                             timeout: number = this.timeout) {
        if (name == null || name == '') {
            error("请求地址不能为空");
            return;
        }
        let url: string = name;
        if (name.toLocaleLowerCase().indexOf("http") != 0) {
            url = this.server + name;
        }

        // if (urls[url] != null) {
        //     warn(`地址【${url}】已正在请求中，不能重复请求`);
        //     return;
        // }

        let xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", "application/protobuf");
        xhr.responseType = 'arraybuffer';
        let data: any = {
            url,
            buff
        };
        urls[url] = xhr;
        this.callback(xhr, url, data, completeCallback, errorCallback, timeout);
        xhr.send(buff);
    }

    private deleteCache(url: string) {
        delete urls[url];
    }
}