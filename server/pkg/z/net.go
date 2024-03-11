package z

import (
	"fmt"
	"io/ioutil"
	"net"
	"net/http"
)

// 检查是否为内网 IP 地址
func isPrivateIP(ip net.IP) bool {
	// 内网 IP 地址范围可以根据需求进行自定义
	privateIPRanges := []string{
		"10.0.0.0/8",
		"172.16.0.0/12",
		"192.168.0.0/16",
	}

	for _, cidr := range privateIPRanges {
		_, ipNet, err := net.ParseCIDR(cidr)
		if err != nil {
			continue
		}

		if ipNet.Contains(ip) {
			return true
		}
	}

	return false
}

func IsPublicIP(IP net.IP) bool {
	if IP.IsLoopback() || IP.IsLinkLocalMulticast() || IP.IsLinkLocalUnicast() {
		return false
	}
	if ip4 := IP.To4(); ip4 != nil {
		switch true {
		case ip4[0] == 10:
			return false
		case ip4[0] == 172 && ip4[1] >= 16 && ip4[1] <= 31:
			return false
		case ip4[0] == 192 && ip4[1] == 168:
			return false
		default:
			return true
		}
	}
	return false
}

func GetIp() (string, error) {
	var ip string
	resp, err := http.Get("http://myexternalip.com/raw")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	respData, err := ioutil.ReadAll(resp.Body)
	ip = string(respData)
	return ip, nil
}

func GetPrivateIp() (string, error) {
	var ip string
	// 获取所有网络接口的信息
	ifaces, err := net.Interfaces()
	if err != nil {
		fmt.Println("Error:", err)
		return "", err
	}

	// 遍历每个网络接口
	for _, iface := range ifaces {
		// 排除回环接口和非活动接口
		if iface.Flags&net.FlagLoopback == 0 && iface.Flags&net.FlagUp != 0 {
			addrs, err := iface.Addrs()
			if err != nil {
				fmt.Println("Error:", err)
				continue
			}

			// 遍历每个地址
			for _, addr := range addrs {
				//println("IP：", addr.String())

				switch v := addr.(type) {
				case *net.IPNet:
					// 过滤 IPv6 地址和非内网地址
					if v.IP.To4() != nil && isPrivateIP(v.IP) {
						ip = v.IP.String()
					}
				}
			}
		}
	}
	return ip, nil
}
