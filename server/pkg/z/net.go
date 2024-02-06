package z

import (
	"fmt"
	"net"
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

func GetIp() (string, error) {
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
